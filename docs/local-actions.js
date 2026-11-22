// ZIQVA OLIM versi publik (GitHub Pages): meniru endpoint ./actions versi
// server, dengan data GLOBAL di database awan Supabase (REST API, anon key).
// Peringkat, jumlah online, Mode Kelas, akun Guru/Ortu dan pantauan kini
// berlaku lintas perangkat. Kunci di bawah adalah kunci publik (anon) yang
// memang dirancang untuk ditempel di aplikasi web.
(function () {
  var SB_URL = "https://kxibdredkbgknkjuvykr.supabase.co";
  var SB_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt4aWJkcmVka2Jna25ranV2eWtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTUzMzM2NjUsImV4cCI6MjExMDkwOTY2NX0.rZLNBXb32_AATSrG6hxFmQIzaXsQlrO-VOpO9JW5YI0";

  var originalFetch = window.fetch.bind(window);

  async function sb(path, opts) {
    opts = opts || {};
    var headers = { apikey: SB_KEY, Authorization: "Bearer " + SB_KEY, "Content-Type": "application/json" };
    if (opts.prefer) headers.Prefer = opts.prefer;
    var res;
    var requestInit = {
      method: opts.method || "GET",
      headers: headers,
      body: opts.body ? JSON.stringify(opts.body) : undefined,
    };
    // Hingga 3 percobaan: koneksi seluler yang putus sesaat jangan langsung gagal.
    var lastErr = null;
    for (var attemptNo = 0; attemptNo < 3 && !res; attemptNo++) {
      try {
        res = await originalFetch(SB_URL + "/rest/v1/" + path, requestInit);
      } catch (e) {
        lastErr = e;
        if (attemptNo < 2) await new Promise(function (r) { setTimeout(r, 400 + attemptNo * 500); });
      }
    }
    if (!res) throw new Error("Tidak dapat terhubung ke database. Periksa koneksi internet lalu coba lagi.");
    var text = await res.text();
    var data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = null; }
    if (!res.ok) throw new Error((data && data.message) || "Database menolak permintaan ini.");
    return data;
  }
  function enc(v) { return encodeURIComponent(String(v)); }
  function getRows(table, query) { return sb(table + "?" + query); }
  async function getOne(table, query) { var rows = await getRows(table, query); return rows && rows.length ? rows[0] : null; }
  function insertRow(table, body) { return sb(table, { method: "POST", prefer: "return=representation", body: body }).then(function (r) { return r && r[0]; }); }
  function patchRows(table, query, body) { return sb(table + "?" + query, { method: "PATCH", prefer: "return=representation", body: body }); }
  function deleteRows(table, query) { return sb(table + "?" + query, { method: "DELETE", prefer: "return=minimal" }); }

  function nameKey(n) { return String(n || "").trim().toLowerCase(); }
  var ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function makeCode() { var b = crypto.getRandomValues(new Uint8Array(6)); var s = ""; for (var i = 0; i < b.length; i++) s += ALPHABET[b[i] % ALPHABET.length]; return s; }
  function randomHex(bytes) { var b = crypto.getRandomValues(new Uint8Array(bytes)); var s = ""; for (var i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0"); return s; }
  async function hashPw(password, salt) {
    var d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + password));
    var arr = new Uint8Array(d); var s = ""; for (var i = 0; i < arr.length; i++) s += arr[i].toString(16).padStart(2, "0"); return s;
  }
  async function ensureCode(studentName) {
    var key = nameKey(studentName);
    var row = await getOne("student_codes", "name_key=eq." + enc(key) + "&select=*");
    if (row) return row.code;
    try {
      var created = await insertRow("student_codes", { name_key: key, student_name: String(studentName).trim(), code: makeCode() });
      if (created) return created.code;
    } catch (e) { /* mungkin dibuat perangkat lain bersamaan; ambil ulang */ }
    var again = await getOne("student_codes", "name_key=eq." + enc(key) + "&select=*");
    return again ? again.code : "";
  }
  async function codeFor(studentName) {
    var row = await getOne("student_codes", "name_key=eq." + enc(nameKey(studentName)) + "&select=code");
    return row ? row.code : "";
  }
  async function userForToken(token) {
    if (!token) throw new Error("Sesi login sudah berakhir. Silakan masuk lagi.");
    var sess = await getOne("app_sessions", "token=eq." + enc(token) + "&select=*");
    if (!sess) throw new Error("Sesi login sudah berakhir. Silakan masuk lagi.");
    var user = await getOne("app_users", "id=eq." + enc(sess.user_id) + "&select=*");
    if (!user) throw new Error("Sesi login sudah berakhir. Silakan masuk lagi.");
    return user;
  }
  function toUser(u) { return { id: u.id, name: u.name, username: u.username, role: u.role, organization: u.organization, whatsapp: u.whatsapp || "", email: u.email || "", child_name: u.child_name || "", city: u.city || "", school_address: u.school_address || "" }; }
  async function newSession(userId) {
    var token = crypto.randomUUID() + "-" + crypto.randomUUID();
    await sb("app_sessions", { method: "POST", prefer: "return=minimal", body: { token: token, user_id: userId } });
    return token;
  }
  function strip(a) { var copy = Object.assign({}, a); delete copy.device_id; return copy; }
  function classPub(c) {
    return {
      id: c.id, code: c.code, class_code: c.code, class_name: c.class_name, name: c.class_name,
      jenjang: c.jenjang, subject_id: c.subject_id || "", subject_name: c.subject_name,
      level: c.level, question_count: c.question_count, duration_minutes: c.duration_minutes,
      status: c.status, is_open: c.status === "open", created_at: c.created_at,
    };
  }
  function rankingFromParts(parts) {
    var sorted = parts.filter(function (p) { return p.status === "finished"; }).slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0) || (a.duration_sec || 999999) - (b.duration_sec || 999999); });
    return sorted.map(function (p, i) {
      return {
        rank: i + 1, participant_id: p.id, student_name: p.student_name, name: p.student_name,
        score: p.score, correct: p.correct, total: p.total,
        duration_sec: p.duration_sec, finished_at: p.finished_at,
      };
    });
  }
  async function classRanking(classId) {
    var parts = await getRows("class_participants", "class_id=eq." + enc(classId) + "&select=*");
    return rankingFromParts(parts || []);
  }

  var BAD_WORDS = ["tai","taik","jancok","jancuk","memek","pelacur","tolol","bodoh","kontol","ngentot","entot","bangsat","bajingan","goblok","lonte","sundal","brengsek","keparat","asu","kimak","peler","fuck","shit","bitch"];
  function normalizeName(x) { return String(x || "").toLowerCase().replace(/0/g, "o").replace(/1/g, "i").replace(/3/g, "e").replace(/4/g, "a").replace(/5/g, "s").replace(/7/g, "t").replace(/@/g, "a").replace(/\$/g, "s").replace(/[^a-z]/g, ""); }
  function nameError(nm) { var t = String(nm || "").trim(); if (t.length < 3) return "Nama minimal 3 huruf ya."; var n = normalizeName(t); for (var i = 0; i < BAD_WORDS.length; i++) { if (n.indexOf(BAD_WORDS[i]) >= 0) return "Nama mengandung kata yang tidak sopan. Ganti nama lain ya."; } return null; }

  var actions = {
    async saveAttempt(args) {
      var neS = nameError(args.student_name); if (neS) throw new Error(neS);
      var row = await insertRow("attempts", {
        student_name: args.student_name, jenjang: args.jenjang, mapel: args.mapel, mode: args.mode,
        score: args.score, correct: args.correct, total: args.total, duration_sec: args.duration_sec || 0,
        device_id: args.device_id || "", class_name: args.class_name || null, is_trial: !!args.is_trial, kelas: args.kelas || null,
      });
      var code = await ensureCode(args.student_name);
      return { id: row ? row.id : null, monitor_code: code };
    },
    async listAttempts(args) {
      var limit = args.limit || 30;
      var rows = [];
      if (args.device_id) {
        rows = await getRows("attempts", "device_id=eq." + enc(args.device_id) + "&select=*&order=id.desc&limit=500") || [];
      }
      var n = rows.length;
      var codes = {};
      var names = {};
      rows.forEach(function (r) { names[nameKey(r.student_name)] = true; });
      var keys = Object.keys(names);
      if (keys.length) {
        var codeRows = await getRows("student_codes", "name_key=in.(" + keys.map(function (k) { return '"' + k.replace(/"/g, "") + '"'; }).join(",") + ")&select=*") || [];
        codeRows.forEach(function (c) { codes[c.name_key] = c.code; });
      }
      return {
        attempts: rows.slice(0, limit).map(function (r) { var c = strip(r); c.monitor_code = codes[nameKey(r.student_name)] || ""; return c; }),
        stats: {
          total_attempts: n,
          average_score: n ? Math.round(rows.reduce(function (s, r) { return s + r.score; }, 0) / n) : 0,
          best_score: n ? Math.max.apply(null, rows.map(function (r) { return r.score; })) : 0,
          total_questions: rows.reduce(function (s, r) { return s + r.total; }, 0),
          total_correct: rows.reduce(function (s, r) { return s + r.correct; }, 0),
        },
      };
    },
    async deleteAttempt(args) {
      await deleteRows("attempts", "id=eq." + enc(args.id) + "&device_id=eq." + enc(args.device_id || ""));
      return { ok: true };
    },
    async register(args) {
      var neR = nameError(args.name); if (neR) throw new Error(neR);
      var username = String(args.username).trim().toLowerCase();
      if (String(args.role || "").toLowerCase() === "admin") {
        var adminRow = await getOne("app_users", "role=eq.admin&select=id");
        if (adminRow) throw new Error("Akun Superadmin sudah ada. Hanya boleh ada satu Superadmin.");
      }
      var existing = await getOne("app_users", "username=eq." + enc(username) + "&select=id");
      if (existing) throw new Error("Username itu sudah dipakai. Coba username lain atau masuk dengan akun yang ada.");
      var wa = String(args.whatsapp || "").trim();
      var email = String(args.email || "").trim();
      if (!wa && !email) throw new Error("Isi minimal salah satu: Nomor WhatsApp atau Email, supaya kami bisa mengirim info olimpiade terbaru.");
      var salt = randomHex(16);
      var user = await insertRow("app_users", {
        name: args.name, username: username, role: args.role, organization: args.organization || "",
        whatsapp: wa, email: email,
        password_record: salt + "$" + (await hashPw(args.password, salt)),
      });
      var token = await newSession(user.id);
      return { token: token, user: toUser(user) };
    },
    async login(args) {
      var identifier = String(args.identifier != null ? args.identifier : (args.username || "")).trim();
      var user = await getOne("app_users", "username=eq." + enc(identifier.toLowerCase()) + "&select=*");
      if (!user && identifier.indexOf("@") > -1) {
        user = await getOne("app_users", "email=ilike." + enc(identifier) + "&select=*");
      }
      if (!user) {
        var digits = identifier.replace(/\D/g, "");
        if (digits.length >= 9) {
          var variants = {};
          variants[digits] = true;
          if (digits.indexOf("62") === 0) variants["0" + digits.slice(2)] = true;
          if (digits.indexOf("0") === 0) variants["62" + digits.slice(1)] = true;
          var withWa = await getRows("app_users", "whatsapp=neq.&select=*");
          for (var i = 0; i < withWa.length; i++) {
            if (variants[String(withWa[i].whatsapp || "").replace(/\D/g, "")]) { user = withWa[i]; break; }
          }
        }
      }
      if (!user) throw new Error("Data masuk atau kata sandi salah. Periksa lagi ya.");
      var parts = String(user.password_record || "").split("$");
      if ((await hashPw(args.password, parts[0] || "")) !== (parts[1] || "")) throw new Error("Data masuk atau kata sandi salah. Periksa lagi ya.");
      var token = await newSession(user.id);
      return { token: token, user: toUser(user) };
    },
    async updateProfile(args) {
      var me = await userForToken(args.token);
      var name = String(args.name || "").trim();
      if (!name) throw new Error("Isi nama lengkap dulu ya.");
      var neP = nameError(name); if (neP) throw new Error(neP);
      var whatsapp = String(args.whatsapp || "").trim();
      var email = String(args.email || "").trim().toLowerCase();
      if (!whatsapp && !email) throw new Error("Isi minimal salah satu: Nomor WhatsApp atau Email, supaya kami bisa mengirim info olimpiade terbaru.");
      var updated = await patchRows("app_users", "id=eq." + me.id, {
        name: name,
        child_name: String(args.child_name || "").trim(),
        organization: String(args.organization || "").trim(),
        whatsapp: whatsapp,
        email: email,
        city: String(args.city || "").trim(),
        school_address: String(args.school_address || "").trim(),
      });
      return { ok: true, user: toUser(updated[0] || me) };
    },
    async me(args) {
      if (!args.token) return { user: null };
      try { return { user: toUser(await userForToken(args.token)) }; } catch (e) { return { user: null }; }
    },
    async logout(args) {
      await deleteRows("app_sessions", "token=eq." + enc(args.token || ""));
      return { ok: true };
    },
    async addWatchedStudent(args) {
      var user = await userForToken(args.token);
      var row = await getOne("student_codes", "name_key=eq." + enc(nameKey(args.student_name)) + "&select=*");
      if (!row || row.code !== String(args.code).trim().toUpperCase()) throw new Error("Kode pantau tidak cocok untuk nama itu. Minta kode pantau yang tampil di layar hasil / Prestasiku anak, lalu coba lagi.");
      var mine = await getRows("watched", "user_id=eq." + enc(user.id) + "&select=*") || [];
      var dup = mine.find(function (w) { return nameKey(w.student_name) === nameKey(args.student_name); });
      if (dup) return { id: dup.id };
      var entry = await insertRow("watched", { user_id: user.id, student_name: args.student_name });
      return { id: entry ? entry.id : null };
    },
    async removeWatchedStudent(args) {
      var user = await userForToken(args.token);
      await deleteRows("watched", "id=eq." + enc(args.id) + "&user_id=eq." + enc(user.id));
      return { ok: true };
    },
    async monitorDashboard(args) {
      var user = await userForToken(args.token);
      var watchedRows = (await getRows("watched", "user_id=eq." + enc(user.id) + "&select=*&order=id.desc")) || [];
      var watched = watchedRows.map(function (w) { return { id: w.id, student_name: w.student_name }; });
      var all = (await getRows("attempts", "select=*&order=id.desc&limit=500")) || [];
      var visible = all.filter(function (a) { return watched.some(function (w) { return nameKey(w.student_name) === nameKey(a.student_name); }); });
      var byStudent = {};
      visible.forEach(function (a) { (byStudent[a.student_name] = byStudent[a.student_name] || []).push(a); });
      var students = Object.keys(byStudent).map(function (studentName) {
        var list = byStudent[studentName];
        return {
          student_name: studentName, attempts: list.length,
          average_score: Math.round(list.reduce(function (s, r) { return s + r.score; }, 0) / list.length),
          best_score: Math.max.apply(null, list.map(function (r) { return r.score; })),
          total_correct: list.reduce(function (s, r) { return s + r.correct; }, 0),
          total_questions: list.reduce(function (s, r) { return s + r.total; }, 0),
          last_at: list[0] ? list[0].created_at : new Date(0).toISOString(),
          last_mapel: list[0] ? list[0].mapel : "",
        };
      }).sort(function (a, b) { return b.average_score - a.average_score || b.attempts - a.attempts; });
      return { user: toUser(user), watched: watched, attempts: visible.slice(0, 100).map(function (r) { var c = strip(r); c.monitor_code = ""; return c; }), students: students };
    },
    async getLeaderboard(args) {
      var jenjang = args.jenjang || "";
      var limit = args.limit || 50;
      var rows = (await getRows("attempts", "jenjang=eq." + enc(jenjang) + "&is_trial=eq.false&select=*&order=id.desc&limit=2000")) || [];
      var byName = {};
      rows.forEach(function (a) {
        var k = nameKey(a.student_name);
        if (!byName[k]) byName[k] = { student_name: a.student_name, best: a, attempts_count: 0 };
        byName[k].attempts_count += 1;
        var b = byName[k].best;
        if (a.score > b.score || (a.score === b.score && (a.duration_sec || 999999) < (b.duration_sec || 999999))) byName[k].best = a;
      });
      var entries = Object.keys(byName).map(function (k) {
        var g = byName[k]; var a = g.best;
        return {
          student_name: g.student_name, name: g.student_name,
          score: a.score, best_score: a.score,
          duration_sec: a.duration_sec, best_duration_sec: a.duration_sec, time_sec: a.duration_sec,
          correct: a.correct, total: a.total, mapel: a.mapel,
          attempts_count: g.attempts_count, attempts: g.attempts_count,
          last_at: a.created_at,
        };
      }).sort(function (x, y) { return y.score - x.score || (x.duration_sec || 999999) - (y.duration_sec || 999999); });
      entries.forEach(function (e, i) { e.rank = i + 1; });
      var top = entries.slice(0, limit);
      return {
        jenjang: jenjang, entries: top, leaderboard: top,
        total_participants: entries.length, participants: entries.length,
        total_sessions: rows.length, sessions: rows.length,
      };
    },
    async heartbeat(args) {
      if (args && args.device_id) {
        await sb("presence?on_conflict=device_id", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: { device_id: args.device_id, last_seen: new Date().toISOString() } });
      }
      var cutoff = new Date(Date.now() - 90000).toISOString();
      var rows = (await getRows("presence", "last_seen=gt." + enc(cutoff) + "&select=device_id")) || [];
      return { ok: true, online: rows.length };
    },
    async getOnlineCount(args) {
      var cutoff = new Date(Date.now() - 90000).toISOString();
      var rows = (await getRows("presence", "last_seen=gt." + enc(cutoff) + "&select=device_id")) || [];
      return { online: rows.length };
    },
    async createExamClass(args) {
      var user = await userForToken(args.token);
      var role = String(user.role || "").toLowerCase();
      if (role && role.indexOf("guru") === -1 && role.indexOf("teacher") === -1) throw new Error("Hanya akun Guru yang bisa membuat kelas ujian.");
      var code = "KLS-" + makeCode().slice(0, 6);
      var cls = await insertRow("exam_classes", {
        code: code, teacher_id: user.id, class_name: args.class_name,
        jenjang: args.jenjang, subject_id: args.subject_id || "", subject_name: args.subject_name,
        level: args.level, question_count: args.question_count, duration_minutes: args.duration_minutes,
        questions: args.questions || [], status: "open",
      });
      var pub = classPub(cls);
      return Object.assign({ ok: true, class: pub }, pub);
    },
    async listMyClasses(args) {
      var user = await userForToken(args.token);
      var classes = (await getRows("exam_classes", "teacher_id=eq." + enc(user.id) + "&select=*&order=id.desc")) || [];
      var parts = [];
      if (classes.length) {
        var ids = classes.map(function (c) { return c.id; }).join(",");
        parts = (await getRows("class_participants", "class_id=in.(" + ids + ")&select=class_id,status")) || [];
      }
      var result = classes.map(function (c) {
        var pub = classPub(c);
        var ps = parts.filter(function (p) { return p.class_id === c.id; });
        pub.participant_count = ps.length; pub.participants_count = ps.length;
        pub.finished_count = ps.filter(function (p) { return p.status === "finished"; }).length;
        return pub;
      });
      return { classes: result };
    },
    async closeExamClass(args) {
      var user = await userForToken(args.token);
      var updated = await patchRows("exam_classes", "id=eq." + enc(args.class_id) + "&teacher_id=eq." + enc(user.id), { status: "closed" });
      if (!updated || !updated.length) throw new Error("Kelas tidak ditemukan.");
      var pub = classPub(updated[0]);
      return Object.assign({ ok: true, class: pub }, pub);
    },
    async joinClass(args) {
      var neJ = nameError(args.student_name); if (neJ) throw new Error(neJ);
      var code = String(args.code || "").trim().toUpperCase();
      var cls = await getOne("exam_classes", "code=eq." + enc(code) + "&select=*");
      if (!cls) throw new Error("Kode Kelas tidak ditemukan. Periksa lagi kode dari gurumu ya.");
      if (cls.status !== "open") throw new Error("Kelas ini sudah ditutup oleh guru.");
      var parts = (await getRows("class_participants", "class_id=eq." + enc(cls.id) + "&select=*")) || [];
      var key = nameKey(args.student_name);
      var part = parts.find(function (p) { return nameKey(p.student_name) === key; });
      if (!part) {
        part = await insertRow("class_participants", { class_id: cls.id, student_name: String(args.student_name).trim(), device_id: args.device_id || "", status: "working" });
      }
      var pub = classPub(cls);
      if (part.status === "finished") {
        return {
          status: "already_finished", already_finished: true,
          class: pub, participant: part, participant_id: part.id,
          result: { score: part.score, correct: part.correct, total: part.total, duration_sec: part.duration_sec },
          score: part.score, correct: part.correct, total: part.total, duration_sec: part.duration_sec,
          ranking: rankingFromParts(parts),
        };
      }
      return {
        status: "joined", already_finished: false,
        class: pub, participant: part, participant_id: part.id,
        questions: (cls.questions || []).map(function (q) { return { q: q.q, options: q.options, emoji: q.emoji || "", stimulus: q.stimulus || "" }; }),
      };
    },
    async submitClassResult(args) {
      var cls = await getOne("exam_classes", "id=eq." + enc(args.class_id) + "&select=*");
      if (!cls) throw new Error("Kelas tidak ditemukan.");
      var part = await getOne("class_participants", "id=eq." + enc(args.participant_id) + "&class_id=eq." + enc(cls.id) + "&select=*");
      if (!part) throw new Error("Peserta kelas tidak ditemukan.");
      var pkg = cls.questions || [];
      var correct = 0;
      (args.submissions || []).forEach(function (s) {
        var q = pkg.find(function (x) { return x.q === s.q; });
        if (q && s.chosen != null && q.options[q.answer] === s.chosen) correct += 1;
      });
      var total = pkg.length || (args.submissions || []).length;
      var score = total ? Math.round((correct / total) * 100) : 0;
      var duration = args.duration_sec || 0;
      var updated = await patchRows("class_participants", "id=eq." + enc(part.id), {
        status: "finished", score: score, correct: correct, total: total,
        duration_sec: duration, finished_at: new Date().toISOString(),
      });
      var partNow = updated && updated[0] ? updated[0] : Object.assign({}, part, { status: "finished", score: score, correct: correct, total: total, duration_sec: duration });
      await insertRow("attempts", {
        student_name: part.student_name, jenjang: cls.jenjang, mapel: cls.subject_name, mode: "ujian",
        score: score, correct: correct, total: total, duration_sec: duration,
        device_id: args.device_id || part.device_id || "", class_name: cls.class_name,
      });
      var monitorCode = await ensureCode(part.student_name);
      return {
        ok: true, score: score, correct: correct, total: total, duration_sec: duration,
        participant: partNow, participant_id: part.id, class: classPub(cls),
        ranking: await classRanking(cls.id), monitor_code: monitorCode,
      };
    },
    async getClassDashboard(args) {
      var user = await userForToken(args.token);
      var cls = await getOne("exam_classes", "id=eq." + enc(args.class_id) + "&teacher_id=eq." + enc(user.id) + "&select=*");
      if (!cls) throw new Error("Kelas tidak ditemukan.");
      var parts = (await getRows("class_participants", "class_id=eq." + enc(cls.id) + "&select=*&order=id.asc")) || [];
      return {
        class: classPub(cls),
        participants: parts, students: parts,
        ranking: rankingFromParts(parts),
        total_participants: parts.length, participants_count: parts.length,
        finished_count: parts.filter(function (p) { return p.status === "finished"; }).length,
        working_count: parts.filter(function (p) { return p.status !== "finished"; }).length,
      };
    },
    async getClassRankingByCode(args) {
      var code = String(args.code || "").trim().toUpperCase();
      var cls = await getOne("exam_classes", "code=eq." + enc(code) + "&select=*");
      if (!cls) throw new Error("Kode Kelas tidak ditemukan. Periksa lagi kode dari gurumu ya.");
      var parts = (await getRows("class_participants", "class_id=eq." + enc(cls.id) + "&select=*")) || [];
      var working = parts.filter(function (p) { return p.status !== "finished"; }).length;
      return {
        class: classPub(cls), ranking: rankingFromParts(parts),
        working_count: working, still_working: working,
        finished_count: parts.filter(function (p) { return p.status === "finished"; }).length,
        total_participants: parts.length,
      };
    },
    async getSettings(args) {
      var rows = await getRows("app_settings", "select=key,value");
      var map = {};
      rows.forEach(function (r) { map[r.key] = r.value; });
      var settings = {
        challenge_title: map.challenge_title || "",
        prize_text: map.prize_text || "",
        target_sessions: parseInt(map.challenge_target_sessions || "10", 10) || 10,
      };
      return { settings: settings, challenge_title: settings.challenge_title, prize_text: settings.prize_text, target_sessions: settings.target_sessions };
    },
    async adminSetSetting(args) {
      var me = await userForToken(args.token);
      if (!me || me.role !== "admin") throw new Error("Hanya Superadmin yang dapat mengubah pengaturan challenge.");
      var allowed = { challenge_title: 1, prize_text: 1, challenge_target_sessions: 1 };
      if (!allowed[args.key]) throw new Error("Pengaturan tidak dikenal.");
      await sb("app_settings?on_conflict=key", { method: "POST", prefer: "resolution=merge-duplicates,return=minimal", body: { key: args.key, value: String(args.value == null ? "" : args.value), updated_at: new Date().toISOString() } });
      return { ok: true };
    },
    async getMonthlyChallenge(args) {
      var settingsRes = await actions.getSettings({});
      var target = settingsRes.target_sessions;
      var MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      var jkt = new Date(Date.now() + 7 * 3600 * 1000);
      var y = jkt.getUTCFullYear(), mo = jkt.getUTCMonth(), day = jkt.getUTCDate();
      var startISO = new Date(Date.UTC(y, mo, 1) - 7 * 3600 * 1000).toISOString();
      var endISO = new Date(Date.UTC(y, mo + 1, 1) - 7 * 3600 * 1000).toISOString();
      var lastDay = new Date(Date.UTC(y, mo + 1, 0)).getUTCDate();
      var rows = await getRows("attempts", "select=student_name,jenjang,correct,total,created_at&is_trial=eq.false&created_at=gte." + enc(startISO) + "&created_at=lt." + enc(endISO) + "&order=id.asc&limit=20000");
      var jenjangFilter = args && args.jenjang ? String(args.jenjang) : "";
      var byKey = {};
      rows.forEach(function (r) {
        if (jenjangFilter && r.jenjang !== jenjangFilter) return;
        var key = String(r.student_name || "").trim().toLowerCase();
        if (!key) return;
        var e = byKey[key];
        if (!e) { e = byKey[key] = { name: r.student_name, sessions: 0, questions: 0, correct: 0, jenjangCount: {} }; }
        e.name = r.student_name;
        e.sessions += 1;
        e.questions += r.total || 0;
        e.correct += r.correct || 0;
        e.jenjangCount[r.jenjang] = (e.jenjangCount[r.jenjang] || 0) + 1;
      });
      var entries = Object.keys(byKey).map(function (k) {
        var e = byKey[k];
        var points = e.correct * 10;
        var ratio = e.questions ? e.correct / e.questions : 0;
        var domJenjang = "", domCount = -1;
        Object.keys(e.jenjangCount).forEach(function (j) { if (e.jenjangCount[j] > domCount) { domCount = e.jenjangCount[j]; domJenjang = j; } });
        return {
          name: e.name, jenjang: domJenjang, sessions: e.sessions, questions: e.questions, correct: e.correct,
          points: points, accuracy: Math.round(ratio * 100), champion_score: Math.round(points * ratio),
          finisher: e.sessions >= target,
        };
      });
      entries.sort(function (a, b) { return b.champion_score - a.champion_score || b.points - a.points || b.accuracy - a.accuracy || String(a.name).localeCompare(String(b.name)); });
      return {
        period: { label: MONTHS[mo] + " " + y, days_left: lastDay - day },
        settings: settingsRes.settings,
        total_participants: entries.length,
        total_finishers: entries.filter(function (e) { return e.finisher; }).length,
        entries: entries.slice(0, 50),
      };
    },
    async adminExists(args) {
      var row = await getOne("app_users", "role=eq.admin&select=id");
      return { exists: !!row, admin_exists: !!row };
    },
    async adminDashboard(args) {
      var user = await userForToken(args.token);
      if (String(user.role || "").toLowerCase() !== "admin") throw new Error("Hanya Superadmin yang bisa membuka panel ini.");
      var usersRaw = (await getRows("app_users", "select=*&order=id.asc")) || [];
      var users = usersRaw.map(function (u) { return { id: u.id, name: u.name, username: u.username, role: u.role, organization: u.organization, whatsapp: u.whatsapp || "", email: u.email || "", created_at: u.created_at }; });
      var guru = 0, orangtua = 0, admin = 0;
      users.forEach(function (u) {
        var r = String(u.role || "").toLowerCase();
        if (r === "admin") admin += 1;
        else if (r.indexOf("guru") !== -1 || r.indexOf("teacher") !== -1) guru += 1;
        else orangtua += 1;
      });
      var attempts = (await getRows("attempts", "select=*&is_trial=eq.false&order=id.desc&limit=5000")) || [];
      var uniq = {};
      attempts.forEach(function (a) { uniq[nameKey(a.student_name)] = true; });
      var classesRaw = (await getRows("exam_classes", "select=*&order=id.desc")) || [];
      var parts = [];
      if (classesRaw.length) {
        var ids = classesRaw.map(function (c) { return c.id; }).join(",");
        parts = (await getRows("class_participants", "class_id=in.(" + ids + ")&select=class_id,status")) || [];
      }
      var teacherById = {};
      users.forEach(function (u) { teacherById[u.id] = u.name; });
      var classes = classesRaw.map(function (c) {
        var ps = parts.filter(function (p) { return p.class_id === c.id; });
        var pub = classPub(c);
        pub.teacher_name = teacherById[c.teacher_id] || "—";
        pub.participant_count = ps.length; pub.participants_count = ps.length;
        pub.finished_count = ps.filter(function (p) { return p.status === "finished"; }).length;
        return pub;
      });
      var cutoff = new Date(Date.now() - 90000).toISOString();
      var onlineRows = (await getRows("presence", "last_seen=gt." + enc(cutoff) + "&select=device_id")) || [];
      return {
        user: toUser(user),
        total_users: users.length, guru: guru, orangtua: orangtua, admin: admin,
        unique_students: Object.keys(uniq).length,
        total_attempts: attempts.length,
        total_classes: classesRaw.length,
        open_classes: classesRaw.filter(function (c) { return c.status === "open"; }).length,
        closed_classes: classesRaw.filter(function (c) { return c.status !== "open"; }).length,
        class_participants: parts.length,
        online: onlineRows.length,
        users: users, classes: classes,
        recent_attempts: attempts.slice(0, 50).map(strip),
      };
    },
    async adminDeleteUser(args) {
      var user = await userForToken(args.token);
      if (String(user.role || "").toLowerCase() !== "admin") throw new Error("Hanya Superadmin yang bisa menghapus akun.");
      var target = await getOne("app_users", "id=eq." + enc(args.user_id) + "&select=*");
      if (!target) throw new Error("Akun tidak ditemukan.");
      if (target.id === user.id) throw new Error("Kamu tidak bisa menghapus akunmu sendiri.");
      if (String(target.role || "").toLowerCase() === "admin") throw new Error("Akun Superadmin lain tidak bisa dihapus.");
      await deleteRows("watched", "user_id=eq." + enc(target.id));
      await deleteRows("app_sessions", "user_id=eq." + enc(target.id));
      await deleteRows("app_users", "id=eq." + enc(target.id));
      return { ok: true };
    },
    async adminDeleteClass(args) {
      var user = await userForToken(args.token);
      if (String(user.role || "").toLowerCase() !== "admin") throw new Error("Hanya Superadmin yang bisa menghapus kelas.");
      var cls = await getOne("exam_classes", "id=eq." + enc(args.class_id) + "&select=id");
      if (!cls) throw new Error("Kelas tidak ditemukan.");
      await deleteRows("class_participants", "class_id=eq." + enc(args.class_id));
      await deleteRows("exam_classes", "id=eq." + enc(args.class_id));
      return { ok: true };
    },
    async adminDeleteAttempt(args) {
      var user = await userForToken(args.token);
      if (String(user.role || "").toLowerCase() !== "admin") throw new Error("Hanya Superadmin yang bisa menghapus nilai.");
      await deleteRows("attempts", "id=eq." + enc(args.attempt_id));
      return { ok: true };
    },
    async resetAllData(args) {
      var deviceId = args.device_id || "";
      var mine = (await getRows("attempts", "device_id=eq." + enc(deviceId) + "&select=id,student_name")) || [];
      var names = {};
      mine.forEach(function (a) { names[nameKey(a.student_name)] = a.student_name; });
      await deleteRows("attempts", "device_id=eq." + enc(deviceId));
      var keys = Object.keys(names);
      for (var i = 0; i < keys.length; i++) {
        var remaining = await getOne("attempts", "student_name=eq." + enc(names[keys[i]]) + "&select=id");
        if (!remaining) await deleteRows("student_codes", "name_key=eq." + enc(keys[i]));
      }
      if (args.token) {
        var sess = await getOne("app_sessions", "token=eq." + enc(args.token) + "&select=*");
        if (sess) {
          await deleteRows("watched", "user_id=eq." + enc(sess.user_id));
          await deleteRows("app_sessions", "token=eq." + enc(args.token));
        }
      }
      return { ok: true, deleted_attempts: mine.length };
    },
  };

  window.fetch = function (input, init) {
    var url = typeof input === "string" ? input : (input && input.url) || "";
    var method = (init && init.method) || (typeof input === "object" && input && input.method) || "GET";
    if (method.toUpperCase() === "POST" && /\/actions(\?|$)/.test(url)) {
      return (async function () {
        try {
          var bodyText = init && init.body ? String(init.body) : (typeof input === "object" ? await input.clone().text() : "{}");
          var payload = JSON.parse(bodyText || "{}");
          var fn = actions[payload.action];
          if (!fn) throw new Error("Aksi tidak dikenal: " + payload.action);
          var data = await fn(payload.args || {});
          return new Response(JSON.stringify({ data: data }), { status: 200, headers: { "content-type": "application/json" } });
        } catch (e) {
          return new Response(JSON.stringify({ error: e && e.message ? e.message : String(e) }), { status: 200, headers: { "content-type": "application/json" } });
        }
      })();
    }
    return originalFetch(input, init);
  };
})();
