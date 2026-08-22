import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

(function(){
  "use strict";

  /* Replace these placeholders with Firebase console > Project settings values. */
  var firebaseConfig = {
    apiKey: "AIzaSyDDWJQhY6lU7sFKU-BTkyfYuU70ZNlDiaU",
  authDomain: "study-planner-f2eff.firebaseapp.com",
  projectId: "study-planner-f2eff",
  storageBucket: "study-planner-f2eff.firebasestorage.app",
  messagingSenderId: "606153882384",
  appId: "1:606153882384:web:e7cda618ceebb970430395"
};
  var firebaseConfigured = firebaseConfig.apiKey !== 'YOUR_API_KEY' && firebaseConfig.projectId !== 'YOUR_PROJECT_ID';
  var firebaseApp = firebaseConfigured ? initializeApp(firebaseConfig) : null;
  var auth = firebaseApp ? getAuth(firebaseApp) : null;
  var db = firebaseApp ? getFirestore(firebaseApp) : null;
  var googleProvider = firebaseApp ? new GoogleAuthProvider() : null;
  var account = { user: null, signUp: true };



  /* ================= constants ================= */
  var MOOD_ICONS = {
    happy: '<circle cx="12" cy="12" r="9" fill="none"/><path d="M8 10.5c.4-.4.9-.4 1.3 0M14.7 10.5c.4-.4.9-.4 1.3 0" stroke-linecap="round"/><path d="M8.3 14.5c1.2 1.4 6.2 1.4 7.4 0" fill="none" stroke-linecap="round"/>',
    good: '<circle cx="12" cy="12" r="9" fill="none"/><path d="M8 10.5c.4-.4.9-.4 1.3 0M14.7 10.5c.4-.4.9-.4 1.3 0" stroke-linecap="round"/><path d="M8.6 14.3c1 .8 5.8.8 6.8 0" fill="none" stroke-linecap="round"/>',
    neutral: '<circle cx="12" cy="12" r="9" fill="none"/><path d="M8 10.5c.4-.4.9-.4 1.3 0M14.7 10.5c.4-.4.9-.4 1.3 0" stroke-linecap="round"/><path d="M8.5 14.8h7" stroke-linecap="round"/>',
    tired: '<circle cx="12" cy="12" r="9" fill="none"/><path d="M7.7 10.8c.4.5 1.2.5 1.6 0M14.7 10.8c.4.5 1.2.5 1.6 0" stroke-linecap="round"/><path d="M8.5 15.4h7" stroke-linecap="round"/>',
    sad: '<circle cx="12" cy="12" r="9" fill="none"/><path d="M8 10.5c.4-.4.9-.4 1.3 0M14.7 10.5c.4-.4.9-.4 1.3 0" stroke-linecap="round"/><path d="M8.6 16c1-1.2 5.8-1.2 6.8 0" fill="none" stroke-linecap="round"/>'
  };
  var MOOD_ORDER = ['happy','good','neutral','tired','sad'];

  var DEFAULT_SCHEDULE_SLOTS = ["6:00 - 7:00","7:00 - 8:00","8:00 - 9:00","9:00 - 10:00","10:00 - 11:00","11:00 - 12:00","12:00 - 1:00","1:00 - 2:00","2:00 - 3:00","3:00 - 4:00","4:00 - 5:00","5:00 - 6:00","6:00 - 7:00","7:00 - 8:00","8:00 - 9:00","9:00 - 10:00"];

  var DEFAULT_GOALS = ["Finish mathematics chapter","Review physics notes","Complete coding project","",""];

  var DEFAULT_HABITS = ["Study","Read","Exercise","Drink Water","No Screens","Sleep Early","Meditate"];

  var DEFAULT_QUOTES = [
    "Small steps every day lead to big results.",
    "You are your only limit.",
    "Discipline is choosing what you want most over what you want now.",
    "Progress, not perfection.",
    "The secret of getting ahead is getting started.",
    "Focus on being productive instead of busy.",
    "Your future is created by what you do today.",
    "Success is the sum of small efforts repeated daily.",
    "Study like you have never studied before.",
    "Every accomplishment starts with the decision to try."
  ];

  var ACCENTS = ["#c9b896","#b8b3ad","#c99b96","#96b0c9","#a3c996","#c9c096"];

  var DOW = ["M","T","W","T","F","S","S"];
  var DOW_FULL = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
  var MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  /* ================= state ================= */
  var state = {
    view: 'dashboard',
    selectedDate: todayStr(),
    calMonth: new Date().getMonth(),
    calYear: new Date().getFullYear(),
    todoFilter: 'all',
    pomoMode: 'focus',
    pomoSeconds: 25*60,
    pomoRunning: false,
    pomoInterval: null,
    pomoSessionsToday: 0,
    currentQuote: DEFAULT_QUOTES[Math.floor(Math.random()*DEFAULT_QUOTES.length)],
    quotes: DEFAULT_QUOTES.slice(),
    habitsList: DEFAULT_HABITS.slice(),
    data: {},          // plannerData keyed by date
    settings: { accent: ACCENTS[0], fontSize: 'md' }
  };

  function todayStr(){
    var d = new Date();
    return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
  }
  function pad(n){ return n<10 ? "0"+n : ""+n; }
  function uid(){ return Math.random().toString(36).slice(2,10); }

  function emptyDay(){
    return {
      mood: null,
      priorities: [{id:uid(),text:'',done:false},{id:uid(),text:'',done:false},{id:uid(),text:'',done:false}],
      schedule: DEFAULT_SCHEDULE_SLOTS.map(function(t){ return {id:uid(),time:t,subject:'',task:'',done:false}; }),
      todos: [],
      goals: DEFAULT_GOALS.map(function(g){ return {id:uid(),text:g,done:false}; }),
      habits: {},
      reminders: [],
      notes: '',
      gratitude: ''
    };
  }

  function getDay(dateStr){
    if(!state.data[dateStr]) state.data[dateStr] = emptyDay();
    var d = state.data[dateStr];
    // backfill in case of older/partial records
    if(!d.priorities) d.priorities = emptyDay().priorities;
    if(!d.schedule) d.schedule = emptyDay().schedule;
    if(!d.todos) d.todos = [];
    if(!d.goals) d.goals = emptyDay().goals;
    if(!d.habits) d.habits = {};
    if(!d.reminders) d.reminders = [];
    if(typeof d.notes !== 'string') d.notes = '';
    if(typeof d.gratitude !== 'string') d.gratitude = '';
    return d;
  }

  /* ================= persistence (artifact storage) ================= */
  var saveTimer = null;
  function scheduleSave(){
    clearTimeout(saveTimer);
    saveTimer = setTimeout(doSave, 500);
  }
  function doSave(){
    try{
      var payload = JSON.stringify({
        data: state.data, habitsList: state.habitsList, quotes: state.quotes, settings: state.settings
      });
      if(firebaseConfigured && account.user){
        setDoc(doc(db, 'users', account.user.uid), {
          plannerData: JSON.parse(payload),
          updatedAt: new Date().toISOString()
        }).catch(function(){ showToast('Cloud save failed'); });
        return;
      }
      if(window.storage){
        window.storage.set('plannerData', JSON.stringify(state.data), false).catch(function(){});
        window.storage.set('plannerMeta', payload, false).catch(function(){});
      }
    }catch(e){}
  }

  function loadAll(){
    if(firebaseConfigured && account.user){
      getDoc(doc(db, 'users', account.user.uid)).then(function(snapshot){
        if(snapshot.exists() && snapshot.data().plannerData) applyPayload(snapshot.data().plannerData);
        applySettings(); render();
      }).catch(function(){ render(); });
      return;
    }
    if(!window.storage){ render(); return; }
    Promise.all([
      window.storage.get('plannerData', false).catch(function(){ return null; }),
      window.storage.get('plannerMeta', false).catch(function(){ return null; })
    ]).then(function(results){
      try{
        if(results[0] && results[0].value) state.data = JSON.parse(results[0].value);
      }catch(e){}
      try{
        if(results[1] && results[1].value){
          var meta = JSON.parse(results[1].value);
          applyPayload(meta);
        }
      }catch(e){}
      applySettings();
      render();
    }).catch(function(){ render(); });
  }

  function applyPayload(payload){
    if(payload.data) state.data = payload.data;
    if(payload.habitsList) state.habitsList = payload.habitsList;
    if(payload.quotes) state.quotes = payload.quotes;
    if(payload.settings) state.settings = payload.settings;
  }

  function applySettings(){
    document.documentElement.style.setProperty('--accent', state.settings.accent || ACCENTS[0]);
    var sizes = {sm:'13.5px', md:'15px', lg:'16.5px'};
    document.documentElement.style.setProperty('--fs', sizes[state.settings.fontSize] || sizes.md);
  }

  /* ================= toast ================= */
  var toastTimer;
  function showToast(msg){
    var t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function(){ t.classList.remove('show'); }, 1600);
  }

  /* ================= productivity calc ================= */
  function computeProgress(dateStr){
    var d = getDay(dateStr);
    var total = 0, done = 0;
    d.priorities.forEach(function(p){ if(p.text.trim()){ total++; if(p.done) done++; } });
    d.todos.forEach(function(t){ total++; if(t.done) done++; });
    d.goals.forEach(function(g){ if(g.text.trim()){ total++; if(g.done) done++; } });
    d.schedule.forEach(function(s){ if(s.subject.trim() || s.task.trim()){ total++; if(s.done) done++; } });
    if(total===0) return 0;
    return Math.round((done/total)*100);
  }

  function computeStreak(){
    var streak = 0;
    var d = new Date();
    for(var i=0;i<365;i++){
      var ds = d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
      var p = state.data[ds] ? computeProgress(ds) : -1;
      if(p >= 50){ streak++; d.setDate(d.getDate()-1); }
      else break;
    }
    return streak;
  }

  /* ================= render root ================= */
  function render(){
    var app = document.getElementById('app');
    var html = navHtml();
    if(state.view === 'dashboard') html += dashboardHtml();
    else if(state.view === 'calendar') html += calendarHtml();
    else if(state.view === 'statistics') html += statisticsHtml();
    else if(state.view === 'settings') html += settingsHtml();
    app.innerHTML = html;
    attachEvents();
    if(state.view === 'dashboard') updatePomoDisplay();
  }

  function navHtml(){
    var views = [['dashboard','Dashboard'],['calendar','Calendar'],['statistics','Statistics'],['settings','Settings']];
    var html = '<div class="topnav">';
    views.forEach(function(v){
      html += '<button class="navbtn '+(state.view===v[0]?'active':'')+'" data-nav="'+v[0]+'">'+v[1]+'</button>';
    });
    if(firebaseConfigured && account.user){
      html += '<div class="account-control"><span>'+esc(account.user.email || 'Account')+'</span><button id="signOutBtn" type="button">Sign out</button></div>';
    } else {
      html += '<button class="account-control account-link" id="authOpenBtn" type="button">Sign in</button>';
    }
    html += '</div>';
    return html;
  }

  /* ================= dashboard ================= */
  function dashboardHtml(){
    var d = getDay(state.selectedDate);
    var progress = computeProgress(state.selectedDate);
    var streak = computeStreak();

    var html = '<div class="wrap fade-in">';

    /* hero */
    html += '<div class="hero">';
    html += '  <div class="card motiv-card">';
    html += '    <div class="tape"></div>';
    html += '    <div class="word">Discipline</div><div class="word">Today</div><div class="word">Success</div><div class="word">Tomorrow</div>';
    html += '  </div>';
    html += '  <div class="hero-center">';
    html += '    <div class="script">study</div>';
    html += '    <div class="display">PLANNER</div>';
    html += '    <div class="hero-divider"><span class="line"></span><span class="star">âœ¦</span><span class="line"></span></div>';
    html += '    <div class="tagline">Focus Today, Excel Tomorrow</div>';
    html += '  </div>';
    html += '  <div class="hero-right">';
    html += '    <div class="card date-card">';
    html += '      <div class="label"><span>Date</span><span>âœ¦</span></div>';
    html += '      <input type="date" id="dateInput" value="'+state.selectedDate+'">';
    html += '    </div>';
    html += '    <div class="card mood-card">';
    html += '      <div class="label">Today\'s Mood</div>';
    html += '      <div class="mood-row">';
    MOOD_ORDER.forEach(function(m){
      html += '<button class="mood-btn '+(d.mood===m?'selected':'')+'" data-mood="'+m+'">';
      html += '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.3">'+MOOD_ICONS[m]+'</svg>';
      html += '<span>'+m+'</span></button>';
    });
    html += '      </div>';
    html += '    </div>';
    html += '  </div>';
    html += '</div>';

    /* top priorities */
    html += '<div class="section">';
    html += sectionTitle('Top Priorities');
    html += '<div class="card priorities">';
    d.priorities.forEach(function(p, i){
      html += '<div class="priority-item">';
      html += '<span class="priority-num">'+pad(i+1)+'</span>';
      html += '<div class="chk '+(p.done?'checked':'')+'" data-pri-check="'+p.id+'"></div>';
      html += '<input type="text" class="'+(p.done?'done':'')+'" placeholder="Add priority..." value="'+esc(p.text)+'" data-pri-text="'+p.id+'">';
      html += '</div>';
    });
    html += '</div></div>';

    /* schedule + todo */
    html += '<div class="cols2">';

    html += '<div class="section">';
    html += sectionTitle('Study Schedule');
    html += '<div class="card schedule-wrap">';
    html += '<table class="sched"><thead><tr><th>Time</th><th>Subject / Topic</th><th>Task</th><th>âœ“</th><th></th></tr></thead><tbody>';
    d.schedule.forEach(function(s){
      html += '<tr class="'+(s.done?'done':'')+'">';
      html += '<td class="time-col">'+esc(s.time)+'</td>';
      html += '<td><input type="text" placeholder="Subject" value="'+esc(s.subject)+'" data-sched-subject="'+s.id+'"></td>';
      html += '<td><input type="text" placeholder="Task" value="'+esc(s.task)+'" data-sched-task="'+s.id+'"></td>';
      html += '<td><div class="chk '+(s.done?'checked':'')+'" data-sched-check="'+s.id+'"></div></td>';
      html += '<td><button class="rm-row" data-sched-remove="'+s.id+'">âœ•</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    html += '<div class="sched-actions">';
    html += '<button class="ghost-btn" id="addSlot">+ Add Time Slot</button>';
    html += '<button class="ghost-btn" id="clearSchedule">Clear Schedule</button>';
    html += '</div></div></div>';

    html += '<div>';
    html += '<div class="section">';
    html += sectionTitle('To-Do List');
    html += '<div class="card todo-wrap">';
    html += '<div class="todo-filters">';
    ['all','active','completed'].forEach(function(f){
      html += '<button class="filter-btn '+(state.todoFilter===f?'active':'')+'" data-filter="'+f+'">'+f+'</button>';
    });
    html += '</div>';
    html += '<div class="todo-add"><input type="text" id="todoInput" placeholder="Add a task..."><button id="todoAddBtn">+</button></div>';
    html += '<div id="todoList">';
    var filtered = d.todos.filter(function(t){
      if(state.todoFilter==='active') return !t.done;
      if(state.todoFilter==='completed') return t.done;
      return true;
    });
    if(filtered.length===0) html += '<div style="color:var(--text2);font-size:12.5px;padding:8px 2px;">No tasks here.</div>';
    filtered.forEach(function(t){
      html += '<div class="todo-item '+(t.done?'done':'')+'" draggable="true" data-todo-id="'+t.id+'">';
      html += '<span class="drag-handle">â‹®â‹®</span>';
      html += '<div class="chk '+(t.done?'checked':'')+'" data-todo-check="'+t.id+'"></div>';
      html += '<span class="txt" contenteditable="true" data-todo-edit="'+t.id+'">'+esc(t.text)+'</span>';
      html += '<button class="del-btn" data-todo-remove="'+t.id+'">âœ•</button>';
      html += '</div>';
    });
    html += '</div>';
    html += '<div class="quote-card"><p>"'+esc(state.currentQuote)+'"</p></div>';
    html += '</div></div>';

    html += '<div class="section">';
    html += sectionTitle('Remember');
    html += '<div class="card remember-wrap">';
    d.reminders.forEach(function(r){
      html += '<div class="rem-item '+(r.done?'done':'')+'">';
      html += '<div class="chk '+(r.done?'checked':'')+'" data-rem-check="'+r.id+'"></div>';
      html += '<input type="text" value="'+esc(r.text)+'" data-rem-text="'+r.id+'">';
      html += '<button class="del-btn" data-rem-remove="'+r.id+'">âœ•</button>';
      html += '</div>';
    });
    html += '<div class="add-line"><span>+</span><input type="text" id="remInput" placeholder="Add reminder..."></div>';
    html += '</div></div>';
    html += '</div>'; // end right col

    html += '</div>'; // cols2

    /* goals + habits + notes */
    html += '<div class="cols2">';
    html += '<div>';

    html += '<div class="section">';
    html += sectionTitle("Today's Goals");
    html += '<div class="card goals-wrap">';
    d.goals.forEach(function(g,i){
      html += '<div class="goal-row '+(g.done?'done':'')+'">';
      html += '<div class="goal-num">'+(i+1)+'</div>';
      html += '<input type="text" placeholder="Add a goal..." value="'+esc(g.text)+'" data-goal-text="'+g.id+'">';
      html += '<div class="chk '+(g.done?'checked':'')+'" data-goal-check="'+g.id+'"></div>';
      html += '<button class="del-btn" data-goal-remove="'+g.id+'">âœ•</button>';
      html += '</div>';
    });
    html += '<div style="text-align:center;margin-top:10px;"><button class="ghost-btn" id="addGoal">+ Add Goal</button></div>';
    html += '</div></div>';

    html += '<div class="section">';
    html += sectionTitle('Habit Tracker');
    html += '<div class="card habit-wrap">';
    var week = weekDates(state.selectedDate);
    html += '<table class="habits"><thead><tr><th style="text-align:left;">Habit</th>';
    DOW.forEach(function(dow){ html += '<th>'+dow+'</th>'; });
    html += '<th></th></tr></thead><tbody>';
    var totalCells=0, onCells=0;
    state.habitsList.forEach(function(h){
      html += '<tr><td class="hname" contenteditable="true" data-habit-rename="'+esc(h)+'">'+esc(h)+'</td>';
      week.forEach(function(wd){
        var on = !!(getDay(wd).habits && getDay(wd).habits[h]);
        totalCells++; if(on) onCells++;
        html += '<td><div class="habit-dot '+(on?'on':'')+'" data-habit-toggle="'+h+'|'+wd+'"></div></td>';
      });
      html += '<td><button class="del-btn" data-habit-remove="'+esc(h)+'">âœ•</button></td>';
      html += '</tr>';
    });
    html += '</tbody></table>';
    var pct = totalCells ? Math.round((onCells/totalCells)*100) : 0;
    html += '<div class="habit-progress"><div class="label"><span>Weekly Progress</span><span>'+pct+'%</span></div>';
    html += '<div class="pbar"><div class="pbar-fill" style="width:'+pct+'%;"></div></div></div>';
    html += '<div class="habit-add"><input type="text" id="habitInput" placeholder="Add new habit..."><button class="ghost-btn" id="habitAddBtn">Add</button></div>';
    html += '</div></div>';

    html += '</div>'; // left col

    html += '<div class="section">';
    html += sectionTitle('Notes');
    html += '<div class="card notes-wrap">';
    html += '<textarea class="notes-textarea" id="notesArea" placeholder="Write freely...">'+esc(d.notes)+'</textarea>';
    html += '</div></div>';

    html += '</div>'; // cols2

    /* productivity row */
    html += '<div class="productivity-row">';

    html += '<div class="card pomo-card">';
    html += sectionTitle('Focus Timer');
    html += '<div class="pomo-modes">';
    [['focus','Focus'],['short','Short Break'],['long','Long Break']].forEach(function(m){
      html += '<button class="pomo-mode-btn '+(state.pomoMode===m[0]?'active':'')+'" data-pomo-mode="'+m[0]+'">'+m[1]+'</button>';
    });
    html += '</div>';
    html += '<div class="pomo-time" id="pomoTime">'+formatTime(state.pomoSeconds)+'</div>';
    html += '<div class="pomo-controls">';
    html += '<button class="pomo-btn" id="pomoStart">'+(state.pomoRunning?'Pause':'Start')+'</button>';
    html += '<button class="pomo-btn" id="pomoReset">Reset</button>';
    html += '</div>';
    html += '<div class="pomo-sessions">Sessions completed today: '+state.pomoSessionsToday+'</div>';
    html += '</div>';

    html += '<div class="card progress-card">';
    html += sectionTitle("Today's Progress");
    html += ringSvg(progress);
    html += '</div>';

    html += '<div class="card streak-card">';
    html += sectionTitle('Streak');
    html += '<div class="streak-fire">ðŸ”¥</div>';
    html += '<div class="streak-num">'+streak+'</div>';
    html += '<div class="streak-txt">Day Streak</div>';
    html += '</div>';

    html += '</div>'; // productivity row

    /* reminder + gratitude */
    html += '<div class="bottom-row">';
    html += '<div class="card reminder-card">';
    html += sectionTitle('Daily Reminder');
    html += '<p id="reminderQuote">"'+esc(state.currentQuote)+'"</p>';
    html += '<button class="ghost-btn" id="newReminderBtn">New Reminder</button>';
    html += '</div>';

    html += '<div class="card gratitude-card">';
    html += sectionTitle('Today I Am Grateful For â™¡');
    html += '<textarea id="gratitudeArea" placeholder="Write here...">'+esc(d.gratitude)+'</textarea>';
    html += '</div>';
    html += '</div>';

    html += '</div>'; // wrap
    return html;
  }

  function ringSvg(pct){
    var r = 54, c = 2*Math.PI*r;
    var offset = c - (pct/100)*c;
    var html = '<div class="ring"><svg width="130" height="130" viewBox="0 0 130 130">';
    html += '<circle cx="65" cy="65" r="'+r+'" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="8"/>';
    html += '<circle cx="65" cy="65" r="'+r+'" fill="none" stroke="var(--accent)" stroke-width="8" stroke-linecap="round" stroke-dasharray="'+c+'" stroke-dashoffset="'+offset+'" style="transition:stroke-dashoffset .6s ease;"/>';
    html += '</svg><div class="ring-label"><div class="num">'+pct+'%</div><div class="txt">Complete</div></div></div>';
    return html;
  }

  function sectionTitle(t){
    return '<div class="section-title"><span class="star">âœ¦</span>'+t+'<span class="star">âœ¦</span></div>';
  }

  function weekDates(dateStr){
    var d = new Date(dateStr+'T00:00:00');
    var day = (d.getDay()+6)%7; // 0 = Monday
    var monday = new Date(d); monday.setDate(d.getDate()-day);
    var arr = [];
    for(var i=0;i<7;i++){
      var x = new Date(monday); x.setDate(monday.getDate()+i);
      arr.push(x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(x.getDate()));
    }
    return arr;
  }

  function formatTime(sec){
    var m = Math.floor(sec/60), s = sec%60;
    return pad(m)+":"+pad(s);
  }

  function esc(s){
    return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  /* ================= calendar view ================= */
  function calendarHtml(){
    var html = '<div class="wrap fade-in"><div class="card cal-wrap">';
    var first = new Date(state.calYear, state.calMonth, 1);
    var startDay = (first.getDay()+6)%7;
    var daysInMonth = new Date(state.calYear, state.calMonth+1, 0).getDate();
    var prevDays = new Date(state.calYear, state.calMonth, 0).getDate();

    html += '<div class="cal-head"><button id="calPrev">â€¹</button><div class="cal-title serif">'+MONTH_NAMES[state.calMonth]+' '+state.calYear+'</div><button id="calNext">â€º</button></div>';
    html += '<div class="cal-grid">';
    DOW_FULL.forEach(function(d){ html += '<div class="dow">'+d[0]+'</div>'; });

    var cells = [];
    for(var i=0;i<startDay;i++) cells.push({d: prevDays-startDay+i+1, inmonth:false});
    for(var i=1;i<=daysInMonth;i++) cells.push({d:i, inmonth:true});
    while(cells.length % 7 !== 0) cells.push({d: cells.length, inmonth:false});

    var todayS = todayStr();
    cells.forEach(function(c){
      var ds;
      if(c.inmonth) ds = state.calYear+"-"+pad(state.calMonth+1)+"-"+pad(c.d);
      var hasData = ds && state.data[ds] && dayHasContent(state.data[ds]);
      var cls = 'cal-day '+(c.inmonth?'inmonth':'')+(ds===todayS?' today':'')+(ds===state.selectedDate?' selected':'');
      html += '<div class="'+cls+'" '+(ds?'data-cal-day="'+ds+'"':'')+'>'+c.d+(hasData?'<span class="dot"></span>':'')+'</div>';
    });
    html += '</div></div></div>';
    return html;
  }

  function dayHasContent(d){
    if(d.mood) return true;
    if(d.notes && d.notes.trim()) return true;
    if(d.gratitude && d.gratitude.trim()) return true;
    if(d.priorities && d.priorities.some(function(p){return p.text.trim();})) return true;
    if(d.todos && d.todos.length) return true;
    if(d.goals && d.goals.some(function(g){return g.text.trim();})) return true;
    if(d.reminders && d.reminders.length) return true;
    if(d.schedule && d.schedule.some(function(s){return s.subject.trim()||s.task.trim();})) return true;
    return false;
  }

  /* ================= statistics view ================= */
  function statisticsHtml(){
    var totalTasks=0, doneTasks=0, habitDone=0, habitTotal=0, studySessions=0;
    var dates = Object.keys(state.data);
    dates.forEach(function(ds){
      var d = state.data[ds];
      (d.todos||[]).forEach(function(t){ totalTasks++; if(t.done) doneTasks++; });
      (d.priorities||[]).forEach(function(p){ if(p.text.trim()){ totalTasks++; if(p.done) doneTasks++; } });
      (d.goals||[]).forEach(function(g){ if(g.text.trim()){ totalTasks++; if(g.done) doneTasks++; } });
      (d.schedule||[]).forEach(function(s){ if(s.subject.trim()||s.task.trim()){ totalTasks++; if(s.done){ doneTasks++; studySessions++; } } });
      state.habitsList.forEach(function(h){ habitTotal++; if(d.habits && d.habits[h]) habitDone++; });
    });
    var habitPct = habitTotal ? Math.round((habitDone/habitTotal)*100) : 0;

    // weekly productivity: last 7 days
    var weekLabels = [], weekVals = [];
    var d0 = new Date();
    for(var i=6;i>=0;i--){
      var x = new Date(d0); x.setDate(d0.getDate()-i);
      var ds = x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(x.getDate());
      weekLabels.push(DOW_FULL[(x.getDay()+6)%7]);
      weekVals.push(state.data[ds] ? computeProgress(ds) : 0);
    }

    // monthly productivity: last 4 weeks avg
    var monthLabels=[], monthVals=[];
    for(var w=3; w>=0; w--){
      var sum=0,count=0;
      for(var i=0;i<7;i++){
        var x = new Date(d0); x.setDate(d0.getDate()-(w*7+i));
        var ds = x.getFullYear()+"-"+pad(x.getMonth()+1)+"-"+pad(x.getDate());
        if(state.data[ds]){ sum += computeProgress(ds); count++; }
      }
      monthLabels.push('Wk '+(4-w));
      monthVals.push(count? Math.round(sum/count) : 0);
    }

    var html = '<div class="wrap fade-in">';
    html += sectionTitle('Statistics');
    html += '<div class="stats-grid">';
    html += statBox(doneTasks, 'Tasks Completed');
    html += statBox(totalTasks-doneTasks, 'Tasks Remaining');
    html += statBox(habitPct+'%', 'Habit Completion');
    html += statBox(studySessions, 'Study Sessions Done');
    html += '</div>';

    html += '<div class="cols2">';
    html += '<div class="card bars">'+sectionTitle('Weekly Productivity')+barsHtml(weekLabels, weekVals)+'</div>';
    html += '<div class="card bars">'+sectionTitle('Monthly Productivity')+barsHtml(monthLabels, monthVals)+'</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function statBox(num, label){
    return '<div class="card stat-box"><div class="num">'+num+'</div><div class="lab">'+label+'</div></div>';
  }
  function barsHtml(labels, vals){
    var html = '';
    labels.forEach(function(l,i){
      html += '<div class="bar-row"><span>'+l+'</span><div class="track"><div class="fill" style="width:'+vals[i]+'%;"></div></div><span>'+vals[i]+'%</span></div>';
    });
    return html;
  }

  /* ================= settings view ================= */
  function settingsHtml(){
    var html = '<div class="wrap fade-in"><div class="settings-wrap">';
    html += sectionTitle('Settings');

    html += '<div class="set-row"><div><div class="st">Account Sync</div><div class="st-sub">'+(firebaseConfigured ? (account.user ? 'Signed in as '+esc(account.user.email || 'your account') : 'Sign in to sync across devices') : 'Add your Firebase configuration in study-planner.js')+'</div></div>';
    if(firebaseConfigured && account.user) html += '<button class="ghost-btn" id="settingsSignOutBtn">Sign out</button>';
    else if(firebaseConfigured) html += '<button class="ghost-btn" id="settingsSignInBtn">Sign in</button>';
    html += '</div>';

    html += '<div class="set-row"><div><div class="st">Accent Color</div><div class="st-sub">Choose the planner\'s highlight color</div></div>';
    html += '<div class="swatches">';
    ACCENTS.forEach(function(c){
      html += '<div class="swatch '+(state.settings.accent===c?'active':'')+'" style="background:'+c+';" data-accent="'+c+'"></div>';
    });
    html += '</div></div>';

    html += '<div class="set-row"><div><div class="st">Font Size</div><div class="st-sub">Adjust text size across the planner</div></div>';
    html += '<div class="fs-btns">';
    [['sm','S'],['md','M'],['lg','L']].forEach(function(f){
      html += '<button class="fs-btn '+(state.settings.fontSize===f[0]?'active':'')+'" data-fontsize="'+f[0]+'">'+f[1]+'</button>';
    });
    html += '</div></div>';

    html += '<div class="set-row"><div><div class="st">Motivational Quotes</div><div class="st-sub">'+state.quotes.length+' quotes in rotation</div></div>';
    html += '<button class="ghost-btn" id="addQuoteBtn">+ Add Quote</button></div>';

    html += '<div class="set-row"><div><div class="st">Export Planner Data</div><div class="st-sub">Download all your planner data as JSON</div></div>';
    html += '<button class="ghost-btn" id="exportBtn">Export</button></div>';

    html += '<div class="set-row"><div><div class="st">Reset Selected Day</div><div class="st-sub">Clear all data for '+state.selectedDate+'</div></div>';
    html += '<button class="danger-btn" id="resetDayBtn">Reset Day</button></div>';

    html += '<div class="set-row" style="border-bottom:none;"><div><div class="st">Reset All Data</div><div class="st-sub">Clear the entire planner permanently</div></div>';
    html += '<button class="danger-btn" id="resetAllBtn">Reset All</button></div>';

    html += '</div></div>';
    return html;
  }

  /* ================= pomodoro engine ================= */
  var POMO_LENGTHS = { focus:25*60, short:5*60, long:15*60 };

  function updatePomoDisplay(){
    var el = document.getElementById('pomoTime');
    if(el) el.textContent = formatTime(state.pomoSeconds);
    var btn = document.getElementById('pomoStart');
    if(btn) btn.textContent = state.pomoRunning ? 'Pause' : 'Start';
  }

  function pomoTick(){
    if(state.pomoSeconds > 0){
      state.pomoSeconds--;
      updatePomoDisplay();
    } else {
      clearInterval(state.pomoInterval);
      state.pomoRunning = false;
      if(state.pomoMode === 'focus') state.pomoSessionsToday++;
      showToast(state.pomoMode==='focus' ? 'Focus session complete âœ¦' : 'Break complete âœ¦');
      render();
    }
  }

  /* ================= events ================= */
  function attachEvents(){
    var app = document.getElementById('app');

    // nav
    app.querySelectorAll('[data-nav]').forEach(function(b){
      b.addEventListener('click', function(){
        state.view = b.getAttribute('data-nav');
        render();
      });
    });

    var authOpenBtn = document.getElementById('authOpenBtn');
    if(authOpenBtn) authOpenBtn.addEventListener('click', openAuth);
    var signOutBtn = document.getElementById('signOutBtn');
    if(signOutBtn) signOutBtn.addEventListener('click', function(){
      signOut(auth).then(function(){ account.user = null; showAuth(); });
    });

    if(state.view === 'dashboard') attachDashboardEvents(app);
    if(state.view === 'calendar') attachCalendarEvents(app);
    if(state.view === 'settings') attachSettingsEvents(app);
  }

  function attachDashboardEvents(app){
    var d = getDay(state.selectedDate);

    // date
    var dateInput = document.getElementById('dateInput');
    if(dateInput){
      dateInput.addEventListener('change', function(){
        state.selectedDate = dateInput.value || todayStr();
        render();
      });
    }

    // mood
    app.querySelectorAll('[data-mood]').forEach(function(b){
      b.addEventListener('click', function(){
        d.mood = d.mood === b.getAttribute('data-mood') ? null : b.getAttribute('data-mood');
        scheduleSave(); render();
      });
    });

    // priorities
    app.querySelectorAll('[data-pri-check]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-pri-check');
        var p = d.priorities.find(function(x){return x.id===id;});
        p.done = !p.done; scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-pri-text]').forEach(function(inp){
      inp.addEventListener('input', function(){
        var id = inp.getAttribute('data-pri-text');
        var p = d.priorities.find(function(x){return x.id===id;});
        p.text = inp.value; scheduleSave();
      });
    });

    // schedule
    app.querySelectorAll('[data-sched-subject]').forEach(function(inp){
      inp.addEventListener('input', function(){
        var id = inp.getAttribute('data-sched-subject');
        var s = d.schedule.find(function(x){return x.id===id;});
        s.subject = inp.value; scheduleSave();
      });
    });
    app.querySelectorAll('[data-sched-task]').forEach(function(inp){
      inp.addEventListener('input', function(){
        var id = inp.getAttribute('data-sched-task');
        var s = d.schedule.find(function(x){return x.id===id;});
        s.task = inp.value; scheduleSave();
      });
    });
    app.querySelectorAll('[data-sched-check]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-sched-check');
        var s = d.schedule.find(function(x){return x.id===id;});
        s.done = !s.done; scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-sched-remove]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-sched-remove');
        d.schedule = d.schedule.filter(function(x){return x.id!==id;});
        scheduleSave(); render();
      });
    });
    var addSlot = document.getElementById('addSlot');
    if(addSlot) addSlot.addEventListener('click', function(){
      d.schedule.push({id:uid(), time:'New Slot', subject:'', task:'', done:false});
      scheduleSave(); render();
    });
    var clearSchedule = document.getElementById('clearSchedule');
    if(clearSchedule) clearSchedule.addEventListener('click', function(){
      d.schedule.forEach(function(s){ s.subject=''; s.task=''; s.done=false; });
      scheduleSave(); render();
    });

    // todo filters
    app.querySelectorAll('[data-filter]').forEach(function(b){
      b.addEventListener('click', function(){
        state.todoFilter = b.getAttribute('data-filter'); render();
      });
    });
    var todoAddBtn = document.getElementById('todoAddBtn');
    var todoInput = document.getElementById('todoInput');
    function addTodo(){
      if(!todoInput.value.trim()) return;
      d.todos.push({id:uid(), text:todoInput.value.trim(), done:false});
      scheduleSave(); render();
    }
    if(todoAddBtn) todoAddBtn.addEventListener('click', addTodo);
    if(todoInput) todoInput.addEventListener('keydown', function(e){ if(e.key==='Enter') addTodo(); });

    app.querySelectorAll('[data-todo-check]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-todo-check');
        var t = d.todos.find(function(x){return x.id===id;});
        t.done = !t.done; scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-todo-remove]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-todo-remove');
        d.todos = d.todos.filter(function(x){return x.id!==id;});
        scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-todo-edit]').forEach(function(span){
      span.addEventListener('blur', function(){
        var id = span.getAttribute('data-todo-edit');
        var t = d.todos.find(function(x){return x.id===id;});
        t.text = span.textContent; scheduleSave();
      });
      span.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); span.blur(); } });
    });

    // drag-drop reorder
    var dragSrc = null;
    app.querySelectorAll('.todo-item').forEach(function(item){
      item.addEventListener('dragstart', function(){ dragSrc = item.getAttribute('data-todo-id'); item.style.opacity='0.4'; });
      item.addEventListener('dragend', function(){ item.style.opacity='1'; });
      item.addEventListener('dragover', function(e){ e.preventDefault(); item.classList.add('dragover'); });
      item.addEventListener('dragleave', function(){ item.classList.remove('dragover'); });
      item.addEventListener('drop', function(e){
        e.preventDefault(); item.classList.remove('dragover');
        var targetId = item.getAttribute('data-todo-id');
        if(dragSrc && dragSrc !== targetId){
          var fromIdx = d.todos.findIndex(function(x){return x.id===dragSrc;});
          var toIdx = d.todos.findIndex(function(x){return x.id===targetId;});
          var moved = d.todos.splice(fromIdx,1)[0];
          d.todos.splice(toIdx,0,moved);
          scheduleSave(); render();
        }
      });
    });

    // remember
    app.querySelectorAll('[data-rem-check]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-rem-check');
        var r = d.reminders.find(function(x){return x.id===id;});
        r.done = !r.done; scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-rem-text]').forEach(function(inp){
      inp.addEventListener('input', function(){
        var id = inp.getAttribute('data-rem-text');
        var r = d.reminders.find(function(x){return x.id===id;});
        r.text = inp.value; scheduleSave();
      });
    });
    app.querySelectorAll('[data-rem-remove]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-rem-remove');
        d.reminders = d.reminders.filter(function(x){return x.id!==id;});
        scheduleSave(); render();
      });
    });
    var remInput = document.getElementById('remInput');
    if(remInput) remInput.addEventListener('keydown', function(e){
      if(e.key==='Enter' && remInput.value.trim()){
        d.reminders.push({id:uid(), text:remInput.value.trim(), done:false});
        scheduleSave(); render();
      }
    });

    // goals
    app.querySelectorAll('[data-goal-text]').forEach(function(inp){
      inp.addEventListener('input', function(){
        var id = inp.getAttribute('data-goal-text');
        var g = d.goals.find(function(x){return x.id===id;});
        g.text = inp.value; scheduleSave();
      });
    });
    app.querySelectorAll('[data-goal-check]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-goal-check');
        var g = d.goals.find(function(x){return x.id===id;});
        g.done = !g.done; scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-goal-remove]').forEach(function(b){
      b.addEventListener('click', function(){
        var id = b.getAttribute('data-goal-remove');
        d.goals = d.goals.filter(function(x){return x.id!==id;});
        scheduleSave(); render();
      });
    });
    var addGoal = document.getElementById('addGoal');
    if(addGoal) addGoal.addEventListener('click', function(){
      d.goals.push({id:uid(), text:'', done:false});
      scheduleSave(); render();
    });

    // habits
    app.querySelectorAll('[data-habit-toggle]').forEach(function(b){
      b.addEventListener('click', function(){
        var parts = b.getAttribute('data-habit-toggle').split('|');
        var h = parts[0], wd = parts[1];
        var day = getDay(wd);
        day.habits[h] = !day.habits[h];
        scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-habit-remove]').forEach(function(b){
      b.addEventListener('click', function(){
        var h = b.getAttribute('data-habit-remove');
        state.habitsList = state.habitsList.filter(function(x){return x!==h;});
        scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-habit-rename]').forEach(function(cell){
      cell.addEventListener('blur', function(){
        var oldName = cell.getAttribute('data-habit-rename');
        var newName = cell.textContent.trim();
        if(newName && newName !== oldName && !state.habitsList.includes(newName)){
          var idx = state.habitsList.indexOf(oldName);
          if(idx>-1) state.habitsList[idx] = newName;
          Object.keys(state.data).forEach(function(ds){
            var dd = state.data[ds];
            if(dd.habits && oldName in dd.habits){
              dd.habits[newName] = dd.habits[oldName];
              delete dd.habits[oldName];
            }
          });
          scheduleSave();
        }
        render();
      });
      cell.addEventListener('keydown', function(e){ if(e.key==='Enter'){ e.preventDefault(); cell.blur(); } });
    });
    var habitAddBtn = document.getElementById('habitAddBtn');
    var habitInput = document.getElementById('habitInput');
    if(habitAddBtn) habitAddBtn.addEventListener('click', function(){
      if(habitInput.value.trim() && !state.habitsList.includes(habitInput.value.trim())){
        state.habitsList.push(habitInput.value.trim());
        scheduleSave(); render();
      }
    });

    // notes
    var notesArea = document.getElementById('notesArea');
    if(notesArea) notesArea.addEventListener('input', function(){
      d.notes = notesArea.value; scheduleSave();
    });

    // gratitude
    var gratitudeArea = document.getElementById('gratitudeArea');
    if(gratitudeArea) gratitudeArea.addEventListener('input', function(){
      d.gratitude = gratitudeArea.value; scheduleSave();
    });

    // pomodoro
    app.querySelectorAll('[data-pomo-mode]').forEach(function(b){
      b.addEventListener('click', function(){
        clearInterval(state.pomoInterval);
        state.pomoRunning = false;
        state.pomoMode = b.getAttribute('data-pomo-mode');
        state.pomoSeconds = POMO_LENGTHS[state.pomoMode];
        render();
      });
    });
    var pomoStart = document.getElementById('pomoStart');
    if(pomoStart) pomoStart.addEventListener('click', function(){
      if(state.pomoRunning){
        clearInterval(state.pomoInterval);
        state.pomoRunning = false;
      } else {
        state.pomoRunning = true;
        state.pomoInterval = setInterval(pomoTick, 1000);
      }
      updatePomoDisplay();
    });
    var pomoReset = document.getElementById('pomoReset');
    if(pomoReset) pomoReset.addEventListener('click', function(){
      clearInterval(state.pomoInterval);
      state.pomoRunning = false;
      state.pomoSeconds = POMO_LENGTHS[state.pomoMode];
      updatePomoDisplay();
    });

    // new reminder quote
    var newReminderBtn = document.getElementById('newReminderBtn');
    if(newReminderBtn) newReminderBtn.addEventListener('click', function(){
      var q;
      do { q = state.quotes[Math.floor(Math.random()*state.quotes.length)]; } while(q===state.currentQuote && state.quotes.length>1);
      state.currentQuote = q;
      document.getElementById('reminderQuote').textContent = '"'+q+'"';
      var qc = document.querySelector('.quote-card p');
      if(qc) qc.textContent = '"'+q+'"';
    });
  }

  function attachCalendarEvents(app){
    var prev = document.getElementById('calPrev');
    var next = document.getElementById('calNext');
    if(prev) prev.addEventListener('click', function(){
      state.calMonth--; if(state.calMonth<0){ state.calMonth=11; state.calYear--; } render();
    });
    if(next) next.addEventListener('click', function(){
      state.calMonth++; if(state.calMonth>11){ state.calMonth=0; state.calYear++; } render();
    });
    app.querySelectorAll('[data-cal-day]').forEach(function(b){
      b.addEventListener('click', function(){
        state.selectedDate = b.getAttribute('data-cal-day');
        state.view = 'dashboard';
        render();
      });
    });
  }

  function attachSettingsEvents(app){
    var settingsSignInBtn = document.getElementById('settingsSignInBtn');
    if(settingsSignInBtn) settingsSignInBtn.addEventListener('click', openAuth);
    var settingsSignOutBtn = document.getElementById('settingsSignOutBtn');
    if(settingsSignOutBtn) settingsSignOutBtn.addEventListener('click', function(){
      signOut(auth).then(function(){ account.user = null; showAuth(); });
    });
    app.querySelectorAll('[data-accent]').forEach(function(b){
      b.addEventListener('click', function(){
        state.settings.accent = b.getAttribute('data-accent');
        applySettings(); scheduleSave(); render();
      });
    });
    app.querySelectorAll('[data-fontsize]').forEach(function(b){
      b.addEventListener('click', function(){
        state.settings.fontSize = b.getAttribute('data-fontsize');
        applySettings(); scheduleSave(); render();
      });
    });
    var addQuoteBtn = document.getElementById('addQuoteBtn');
    if(addQuoteBtn) addQuoteBtn.addEventListener('click', function(){
      var q = prompt('Enter a new motivational quote:');
      if(q && q.trim()){
        state.quotes.push(q.trim());
        scheduleSave(); render();
        showToast('Quote added âœ¦');
      }
    });
    var exportBtn = document.getElementById('exportBtn');
    if(exportBtn) exportBtn.addEventListener('click', function(){
      var blob = new Blob([JSON.stringify({data:state.data, habitsList:state.habitsList, quotes:state.quotes, settings:state.settings}, null, 2)], {type:'application/json'});
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url; a.download = 'study-planner-export.json';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Data exported âœ¦');
    });
    var resetDayBtn = document.getElementById('resetDayBtn');
    if(resetDayBtn) resetDayBtn.addEventListener('click', function(){
      if(confirm('Reset all data for '+state.selectedDate+'?')){
        state.data[state.selectedDate] = emptyDay();
        scheduleSave(); render();
        showToast('Day reset âœ¦');
      }
    });
    var resetAllBtn = document.getElementById('resetAllBtn');
    if(resetAllBtn) resetAllBtn.addEventListener('click', function(){
      if(confirm('This will permanently erase all planner data. Continue?')){
        state.data = {};
        state.habitsList = DEFAULT_HABITS.slice();
        scheduleSave(); render();
        showToast('All data reset âœ¦');
      }
    });
  }

  function openAuth(){
    var shell = document.getElementById('authShell');
    if(shell) shell.hidden = false;
  }

  function showAuth(){
    account.signUp = true;
    setAuthMode();
    openAuth();
    render();
  }

  function setAuthMode(){
    var title = document.getElementById('authTitle');
    var subtitle = document.getElementById('authSubtitle');
    var submit = document.getElementById('authSubmit');
    var switchBtn = document.getElementById('authSwitch');
    if(!title) return;
    title.textContent = account.signUp ? 'Make room for your plans.' : 'Your plans, anywhere.';
    subtitle.textContent = account.signUp ? 'Create an account to sync your planner across devices.' : 'Sign in to access your planner on any device.';
    submit.textContent = account.signUp ? 'Create account' : 'Sign in';
    switchBtn.textContent = account.signUp ? 'Already have an account? Sign in' : 'Need an account? Sign up';
  }

  function setAuthError(message){
    var error = document.getElementById('authError');
    if(error) error.textContent = message || '';
  }

  function attachAuthEvents(){
    var form = document.getElementById('authForm');
    var switchBtn = document.getElementById('authSwitch');
    var googleBtn = document.getElementById('googleAuthBtn');
    if(!form || !switchBtn || !googleBtn) return;
    setAuthMode();
    switchBtn.addEventListener('click', function(){ account.signUp = !account.signUp; setAuthMode(); setAuthError(''); });
    googleBtn.addEventListener('click', function(){
      if(!firebaseConfigured){
        setAuthError('Google sign-in is ready, but Firebase is not connected yet.');
        return;
      }
      googleBtn.disabled = true;
      signInWithPopup(auth, googleProvider).then(function(result){
        account.user = result.user;
        document.getElementById('authShell').hidden = true;
        loadAll();
      }).catch(function(error){ setAuthError(error.message || 'Google sign-in failed.'); })
        .finally(function(){ googleBtn.disabled = false; });
    });
    form.addEventListener('submit', function(e){
      e.preventDefault();
      setAuthError('');
      if(!firebaseConfigured){
        setAuthError('Registration is ready, but Firebase is not connected yet. Add your Firebase configuration at the top of study-planner.js.');
        return;
      }
      var email = document.getElementById('authEmail').value.trim();
      var password = document.getElementById('authPassword').value;
      var action = account.signUp ? createUserWithEmailAndPassword(auth, email, password) : signInWithEmailAndPassword(auth, email, password);
      document.getElementById('authSubmit').disabled = true;
      action.then(function(result){
        account.user = result.user;
        document.getElementById('authShell').hidden = true;
        loadAll();
      }).catch(function(error){ setAuthError(error.message || 'Authentication failed.'); })
        .finally(function(){ document.getElementById('authSubmit').disabled = false; });
    });
  }

  function boot(){
    attachAuthEvents();
    if(!firebaseConfigured){ render(); openAuth(); return; }
    onAuthStateChanged(auth, function(user){
      account.user = user;
      if(user) loadAll(); else { render(); openAuth(); }
    });
  }

  /* ================= init ================= */
  boot();
})();
