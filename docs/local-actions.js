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
