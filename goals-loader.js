import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js';
import { getFirestore, doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js';

(async function () {
  'use strict';

  var firebaseConfig = {
    apiKey: 'AIzaSyDDWJQhY6lU7sFKU-BTkyfYuU70ZNlDiaU',
    authDomain: 'study-planner-f2eff.firebaseapp.com',
    projectId: 'study-planner-f2eff',
    storageBucket: 'study-planner-f2eff.firebasestorage.app',
    messagingSenderId: '606153882384',
    appId: '1:606153882384:web:e7cda618ceebb970430395'
  };
  var firebaseApp = initializeApp(firebaseConfig);
  var auth = getAuth(firebaseApp);
  var db = getFirestore(firebaseApp);
  var authMode = 'signin';
  var reactUrl = 'https://esm.sh/react@18.3.1';
  var reactDomUrl = 'https://esm.sh/react-dom@18.3.1/client?external=react';
  var sourceUrl = './GoalPlannerDashboard.jsx';
  var errorBox = document.createElement('p');
  errorBox.style.cssText = 'max-width:36rem;margin:5rem auto;padding:1.5rem;color:#fecaca;background:#1e293b;border:1px solid #475569;font:14px/1.6 system-ui,sans-serif;';

  function showError(message) {
    errorBox.textContent = message;
    document.body.appendChild(errorBox);
  }

  function setAuthMessage(message) {
    document.getElementById('goalsAuthError').textContent = message || '';
  }

  function setAuthMode(mode) {
    authMode = mode;
    document.getElementById('goalsAuthTitle').textContent = mode === 'signup' ? 'Create your goals account' : 'Sign in to sync your goals';
    document.getElementById('goalsAuthMessage').textContent = mode === 'signup' ? 'Your goals will be available on every device.' : 'Use the same account on every device.';
    document.getElementById('goalsAuthSubmit').textContent = mode === 'signup' ? 'Create account' : 'Sign in';
    document.getElementById('goalsAuthSwitch').textContent = mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up';
  }

  function showAuth() {
    document.getElementById('goalsAuth').hidden = false;
    document.getElementById('root').innerHTML = '';
    var accountButton = document.getElementById('goalsAccountButton');
    if (accountButton) accountButton.remove();
    setAuthMode('signin');
  }

  function saveGoals(user, goals) {
    return setDoc(doc(db, 'users', user.uid), { goals: goals }, { merge: true });
  }

  async function startApp(user, componentModule, React, createRoot) {
    var snapshot = await getDoc(doc(db, 'users', user.uid));
    var savedGoals = snapshot.exists() && Array.isArray(snapshot.data().goals) ? snapshot.data().goals : null;
    document.getElementById('goalsAuth').hidden = true;
    createRoot(document.getElementById('root')).render(
      React.createElement(componentModule.default, {
        savedGoals: savedGoals,
        onGoalsChange: function (goals) {
          saveGoals(user, goals).catch(function () { showError('Could not save goals to Firebase.'); });
        }
      })
    );
    var account = document.createElement('button');
    account.id = 'goalsAccountButton';
    account.textContent = 'Sign out';
    account.type = 'button';
    account.style.cssText = 'position:fixed;right:1rem;top:1rem;z-index:80;padding:.45rem .7rem;color:#94a3b8;background:#1e293b;border:1px solid #475569;border-radius:.45rem;font:12px system-ui,sans-serif;';
    account.onclick = function () { signOut(auth); };
    document.body.appendChild(account);
  }

  function attachAuth() {
    document.getElementById('goalsAuthSwitch').onclick = function () {
      setAuthMode(authMode === 'signin' ? 'signup' : 'signin');
      setAuthMessage('');
    };
    document.getElementById('goalsAuthForm').onsubmit = function (event) {
      event.preventDefault();
      var email = document.getElementById('goalsEmail').value.trim();
      var password = document.getElementById('goalsPassword').value;
      var action = authMode === 'signup'
        ? createUserWithEmailAndPassword(auth, email, password)
        : signInWithEmailAndPassword(auth, email, password);
      document.getElementById('goalsAuthSubmit').disabled = true;
      action.catch(function (error) { setAuthMessage(error.message); })
        .finally(function () { document.getElementById('goalsAuthSubmit').disabled = false; });
    };
  }

  try {
    var results = await Promise.all([
      fetch(sourceUrl),
      import(reactUrl),
      import(reactDomUrl)
    ]);
    if (!results[0].ok) throw new Error('Could not load GoalPlannerDashboard.jsx.');

    var source = await results[0].text();
    source = source.replace(
      'from "react"',
      'from "' + reactUrl + '"'
    ).replace(
      'from "framer-motion"',
      'from "https://esm.sh/framer-motion@11.11.17?external=react"'
    ).replace(
      'from "recharts"',
      'from "https://esm.sh/recharts@2.15.0?external=react"'
    ).replace(
      'from "lucide-react"',
      'from "https://esm.sh/lucide-react@0.468.0?external=react"'
    );
    var transformed = Babel.transform(source, {
      presets: ['react'],
      sourceType: 'module'
    }).code;
    var moduleUrl = URL.createObjectURL(new Blob([transformed], { type: 'text/javascript' }));
    var componentModule = await import(moduleUrl);
    URL.revokeObjectURL(moduleUrl);

    var React = results[1].default || results[1];
    var createRoot = results[2].createRoot;
    attachAuth();
    onAuthStateChanged(auth, function (user) {
      if (user) startApp(user, componentModule, React, createRoot).catch(function (error) { showError('Could not load your goals: ' + error.message); });
      else showAuth();
    });
  } catch (error) {
    showError('The Goals page could not load. Open it through GitHub Pages or a web server, not directly as a file. Details: ' + error.message);
  }
})();
