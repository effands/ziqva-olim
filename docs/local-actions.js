// ZIQVA OLIM versi publik (GitHub Pages): meniru endpoint ./actions versi
// server, tapi semua data disimpan di localStorage browser perangkat ini.
(function () {
  var K = { attempts: "ziqva_attempts", users: "ziqva_users", codes: "ziqva_codes", sessions: "ziqva_sessions", watched: "ziqva_watched", seq: "ziqva_seq" };
  function read(key, fallback) { try { var v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; } }
  function write(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {} }
  function nextId(kind) { var seq = read(K.seq, {}); seq[kind] = (seq[kind] || 0) + 1; write(K.seq, seq); return seq[kind]; }
  function nameKey(n) { return String(n || "").trim().toLowerCase(); }
  var ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  function makeCode() { var b = crypto.getRandomValues(new Uint8Array(6)); var s = ""; for (var i = 0; i < b.length; i++) s += ALPHABET[b[i] % ALPHABET.length]; return s; }
  function randomHex(bytes) { var b = crypto.getRandomValues(new Uint8Array(bytes)); var s = ""; for (var i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0"); return s; }
  async function hashPw(password, salt) {
    var d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(salt + ":" + password));
    var arr = new Uint8Array(d); var s = ""; for (var i = 0; i < arr.length; i++) s += arr[i].toString(16).padStart(2, "0"); return s;
  }
  function ensureCode(studentName) {
    var codes = read(K.codes, {}); var key = nameKey(studentName);
    if (codes[key]) return codes[key].code;
    var code = makeCode(); codes[key] = { student_name: String(studentName).trim(), code: code }; write(K.codes, codes); return code;
  }
  function codeFor(studentName) { var codes = read(K.codes, {}); var row = codes[nameKey(studentName)]; return row ? row.code : ""; }
  function userForToken(token) {
    var sessions = read(K.sessions, {}); var uid = sessions[token];
    var user = read(K.users, []).find(function (u) { return u.id === uid; });
    if (!user) throw new Error("Sesi login sudah berakhir. Silakan masuk lagi.");
    return user;
  }
  function toUser(u) { return { id: u.id, name: u.name, username: u.username, role: u.role, organization: u.organization }; }
  function newSession(userId) {
    var token = crypto.randomUUID() + "-" + crypto.randomUUID();
    var sessions = read(K.sessions, {}); sessions[token] = userId; write(K.sessions, sessions); return token;
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
  function classRanking(classId) {
    var parts = read("ziqva_class_parts", []).filter(function (p) { return p.class_id === classId && p.status === "finished"; });
    var sorted = parts.slice().sort(function (a, b) { return (b.score || 0) - (a.score || 0) || (a.duration_sec || 999999) - (b.duration_sec || 999999); });
    return sorted.map(function (p, i) {
      return {
        rank: i + 1, participant_id: p.id, student_name: p.student_name, name: p.student_name,
        score: p.score, correct: p.correct, total: p.total,
        duration_sec: p.duration_sec, finished_at: p.finished_at,
      };
    });
  }

  var actions = {
    async saveAttempt(args) {
      var attempts = read(K.attempts, []); var id = nextId("attempt");
      attempts.push({ id: id, student_name: args.student_name, jenjang: args.jenjang, mapel: args.mapel, mode: args.mode, score: args.score, correct: args.correct, total: args.total, duration_sec: args.duration_sec, created_at: new Date().toISOString(), monitor_code: "", device_id: args.device_id || "" });
      write(K.attempts, attempts);
      return { id: id, monitor_code: ensureCode(args.student_name) };
    },
    async listAttempts(args) {
      var limit = args.limit || 30;
      var rows = args.device_id ? read(K.attempts, []).filter(function (a) { return a.device_id === args.device_id; }).sort(function (x, y) { return y.id - x.id; }) : [];
      var n = rows.length;
      return {
        attempts: rows.slice(0, limit).map(function (r) { var c = strip(r); c.monitor_code = codeFor(r.student_name); return c; }),
        stats: {
          total_attempts: n,
          average_score: n ? Math.round(rows.reduce(function (s, r) { return s + r.score; }, 0) / n) : 0,
          best_score: n ? Math.max.apply(null, rows.map(function (r) { return r.score; })) : 0,
          total_questions: rows.reduce(function (s, r) { return s + r.total; }, 0),
          total_correct: rows.reduce(function (s, r) { return s + r.correct; }, 0),
        },
      };
    },
    async register(args) {
      var users = read(K.users, []); var username = String(args.username).trim().toLowerCase();
      if (users.some(function (u) { return u.username === username; })) throw new Error("Username itu sudah dipakai. Coba username lain atau masuk dengan akun yang ada.");
      var salt = randomHex(16);
      var user = { id: nextId("user"), name: args.name, username: username, role: args.role, organization: args.organization || "", password_record: salt + "$" + (await hashPw(args.password, salt)) };
      users.push(user); write(K.users, users);
      return { token: newSession(user.id), user: toUser(user) };
    },
    async login(args) {
      var user = read(K.users, []).find(function (u) { return u.username === String(args.username).trim().toLowerCase(); });
      if (!user) throw new Error("Username atau kata sandi salah. Periksa lagi ya.");
      var parts = user.password_record.split("$");
      if ((await hashPw(args.password, parts[0] || "")) !== (parts[1] || "")) throw new Error("Username atau kata sandi salah. Periksa lagi ya.");
      return { token: newSession(user.id), user: toUser(user) };
    },
    async me(args) {
      if (!args.token) return { user: null };
      try { return { user: toUser(userForToken(args.token)) }; } catch (e) { return { user: null }; }
    },
    async logout(args) {
      var sessions = read(K.sessions, {}); delete sessions[args.token]; write(K.sessions, sessions);
      return { ok: true };
    },
    async addWatchedStudent(args) {
      var user = userForToken(args.token);
      var codes = read(K.codes, {}); var row = codes[nameKey(args.student_name)];
      if (!row || row.code !== String(args.code).trim().toUpperCase()) throw new Error("Kode pantau tidak cocok untuk nama itu. Minta kode pantau yang tampil di layar hasil / Prestasiku anak, lalu coba lagi.");
      var watched = read(K.watched, []);
      var dup = watched.find(function (w) { return w.user_id === user.id && w.student_name.toLowerCase() === String(args.student_name).toLowerCase(); });
      if (dup) return { id: dup.id };
      var entry = { id: nextId("watched"), user_id: user.id, student_name: args.student_name };
      watched.push(entry); write(K.watched, watched);
      return { id: entry.id };
    },
    async removeWatchedStudent(args) {
      var user = userForToken(args.token);
      write(K.watched, read(K.watched, []).filter(function (w) { return !(w.id === args.id && w.user_id === user.id); }));
      return { ok: true };
    },
    async monitorDashboard(args) {
      var user = userForToken(args.token);
      var watchedRows = read(K.watched, []).filter(function (w) { return w.user_id === user.id; }).sort(function (a, b) { return b.id - a.id; });
      var watched = watchedRows.map(function (w) { return { id: w.id, student_name: w.student_name }; });
      var all = read(K.attempts, []).sort(function (a, b) { return b.id - a.id; });
      var visible = all.filter(function (a) { return watched.some(function (w) { return w.student_name.toLowerCase() === a.student_name.toLowerCase(); }); });
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
      var rows = read(K.attempts, []).filter(function (a) { return a.jenjang === jenjang; });
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
      var presence = read("ziqva_presence", {});
      var now = Date.now();
      if (args && args.device_id) presence[args.device_id] = now;
      Object.keys(presence).forEach(function (k) { if (now - presence[k] > 90000) delete presence[k]; });
      write("ziqva_presence", presence);
      return { ok: true, online: Object.keys(presence).length };
    },
    async getOnlineCount(args) {
      var presence = read("ziqva_presence", {});
      var now = Date.now();
      Object.keys(presence).forEach(function (k) { if (now - presence[k] > 90000) delete presence[k]; });
      write("ziqva_presence", presence);
      return { online: Object.keys(presence).length };
    },
    async createExamClass(args) {
      var user = userForToken(args.token);
      var role = String(user.role || "").toLowerCase();
      if (role && role.indexOf("guru") === -1 && role.indexOf("teacher") === -1) throw new Error("Hanya akun Guru yang bisa membuat kelas ujian.");
      var classes = read("ziqva_classes", []);
      var code = "KLS-" + makeCode().slice(0, 6);
      var cls = {
        id: nextId("class"), code: code, class_code: code, teacher_id: user.id,
        class_name: args.class_name, name: args.class_name,
        jenjang: args.jenjang, subject_id: args.subject_id || "", subject_name: args.subject_name,
        level: args.level, question_count: args.question_count, duration_minutes: args.duration_minutes,
        questions: args.questions || [], status: "open", is_open: true,
        created_at: new Date().toISOString(),
      };
      classes.push(cls); write("ziqva_classes", classes);
      var pub = classPub(cls);
      return Object.assign({ ok: true, class: pub }, pub);
    },
    async listMyClasses(args) {
      var user = userForToken(args.token);
      var parts = read("ziqva_class_parts", []);
      var classes = read("ziqva_classes", []).filter(function (c) { return c.teacher_id === user.id; }).sort(function (a, b) { return b.id - a.id; }).map(function (c) {
        var pub = classPub(c);
        var ps = parts.filter(function (p) { return p.class_id === c.id; });
        pub.participant_count = ps.length; pub.participants_count = ps.length;
        pub.finished_count = ps.filter(function (p) { return p.status === "finished"; }).length;
        return pub;
      });
      return { classes: classes };
    },
    async closeExamClass(args) {
      var user = userForToken(args.token);
      var classes = read("ziqva_classes", []);
      var cls = classes.find(function (c) { return c.id === args.class_id && c.teacher_id === user.id; });
      if (!cls) throw new Error("Kelas tidak ditemukan.");
      cls.status = "closed"; cls.is_open = false; write("ziqva_classes", classes);
      var pub = classPub(cls);
      return Object.assign({ ok: true, class: pub }, pub);
    },
    async joinClass(args) {
      var classes = read("ziqva_classes", []);
      var code = String(args.code || "").trim().toUpperCase();
      var cls = classes.find(function (c) { return c.code.toUpperCase() === code; });
      if (!cls) throw new Error("Kode Kelas tidak ditemukan. Periksa lagi kode dari gurumu ya.");
      if (cls.status !== "open") throw new Error("Kelas ini sudah ditutup oleh guru.");
      var parts = read("ziqva_class_parts", []);
      var key = nameKey(args.student_name);
      var part = parts.find(function (p) { return p.class_id === cls.id && nameKey(p.student_name) === key; });
      if (!part) {
        part = { id: nextId("participant"), class_id: cls.id, student_name: String(args.student_name).trim(), device_id: args.device_id || "", status: "working", score: null, correct: null, total: null, duration_sec: null, joined_at: new Date().toISOString(), finished_at: null };
        parts.push(part); write("ziqva_class_parts", parts);
      }
      var pub = classPub(cls);
      if (part.status === "finished") {
        return {
          status: "already_finished", already_finished: true,
          class: pub, participant: part, participant_id: part.id,
          result: { score: part.score, correct: part.correct, total: part.total, duration_sec: part.duration_sec },
          score: part.score, correct: part.correct, total: part.total, duration_sec: part.duration_sec,
          ranking: classRanking(cls.id),
        };
      }
      return {
        status: "joined", already_finished: false,
        class: pub, participant: part, participant_id: part.id,
        questions: (cls.questions || []).map(function (q) { return { q: q.q, options: q.options, emoji: q.emoji || "", stimulus: q.stimulus || "" }; }),
      };
    },
    async submitClassResult(args) {
      var classes = read("ziqva_classes", []);
      var cls = classes.find(function (c) { return c.id === args.class_id; });
      if (!cls) throw new Error("Kelas tidak ditemukan.");
      var parts = read("ziqva_class_parts", []);
      var part = parts.find(function (p) { return p.id === args.participant_id && p.class_id === cls.id; });
      if (!part) throw new Error("Peserta kelas tidak ditemukan.");
      var pkg = cls.questions || [];
      var correct = 0;
      (args.submissions || []).forEach(function (s) {
        var q = pkg.find(function (x) { return x.q === s.q; });
        if (q && s.chosen != null && q.options[q.answer] === s.chosen) correct += 1;
      });
      var total = pkg.length || (args.submissions || []).length;
      var score = total ? Math.round((correct / total) * 100) : 0;
      part.status = "finished"; part.score = score; part.correct = correct; part.total = total;
      part.duration_sec = args.duration_sec || 0; part.finished_at = new Date().toISOString();
      write("ziqva_class_parts", parts);
      var attempts = read(K.attempts, []); var aid = nextId("attempt");
      attempts.push({ id: aid, student_name: part.student_name, jenjang: cls.jenjang, mapel: cls.subject_name, mode: "ujian", score: score, correct: correct, total: total, duration_sec: part.duration_sec, created_at: new Date().toISOString(), monitor_code: "", device_id: args.device_id || part.device_id || "", class_name: cls.class_name, exam_class_name: cls.class_name });
      write(K.attempts, attempts);
      ensureCode(part.student_name);
      return {
        ok: true, score: score, correct: correct, total: total, duration_sec: part.duration_sec,
        participant: part, participant_id: part.id, class: classPub(cls),
        ranking: classRanking(cls.id), monitor_code: codeFor(part.student_name),
      };
    },
    async getClassDashboard(args) {
      var user = userForToken(args.token);
      var classes = read("ziqva_classes", []);
      var cls = classes.find(function (c) { return c.id === args.class_id && c.teacher_id === user.id; });
      if (!cls) throw new Error("Kelas tidak ditemukan.");
      var parts = read("ziqva_class_parts", []).filter(function (p) { return p.class_id === cls.id; }).sort(function (a, b) { return a.id - b.id; });
      return {
        class: classPub(cls),
        participants: parts, students: parts,
        ranking: classRanking(cls.id),
        total_participants: parts.length, participants_count: parts.length,
        finished_count: parts.filter(function (p) { return p.status === "finished"; }).length,
        working_count: parts.filter(function (p) { return p.status !== "finished"; }).length,
      };
    },
    async getClassRankingByCode(args) {
      var classes = read("ziqva_classes", []);
      var code = String(args.code || "").trim().toUpperCase();
      var cls = classes.find(function (c) { return c.code.toUpperCase() === code; });
      if (!cls) throw new Error("Kode Kelas tidak ditemukan. Periksa lagi kode dari gurumu ya.");
      var parts = read("ziqva_class_parts", []).filter(function (p) { return p.class_id === cls.id; });
      var working = parts.filter(function (p) { return p.status !== "finished"; }).length;
      return {
        class: classPub(cls), ranking: classRanking(cls.id),
        working_count: working, still_working: working,
        finished_count: parts.filter(function (p) { return p.status === "finished"; }).length,
        total_participants: parts.length,
      };
    },
    async resetAllData(args) {
      var attempts = read(K.attempts, []);
      var mine = attempts.filter(function (a) { return a.device_id === (args.device_id || ""); });
      var names = {}; mine.forEach(function (a) { names[nameKey(a.student_name)] = true; });
      var rest = attempts.filter(function (a) { return a.device_id !== (args.device_id || ""); });
      write(K.attempts, rest);
      var codes = read(K.codes, {});
      Object.keys(names).forEach(function (k) {
        if (!rest.some(function (a) { return nameKey(a.student_name) === k; })) delete codes[k];
      });
      write(K.codes, codes);
      if (args.token) {
        var sessions = read(K.sessions, {}); var uid = sessions[args.token];
        if (uid != null) {
          write(K.watched, read(K.watched, []).filter(function (w) { return w.user_id !== uid; }));
          delete sessions[args.token]; write(K.sessions, sessions);
        }
      }
      return { ok: true, deleted_attempts: mine.length };
    },
    async deleteAttempt(args) {
      write(K.attempts, read(K.attempts, []).filter(function (a) { return !(a.id === args.id && a.device_id === (args.device_id || "")); }));
      return { ok: true };
    },
  };

  var originalFetch = window.fetch.bind(window);
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
