(async function () {
  'use strict';

  var reactUrl = 'https://esm.sh/react@18.3.1';
  var reactDomUrl = 'https://esm.sh/react-dom@18.3.1/client?external=react';
  var sourceUrl = './GoalPlannerDashboard.jsx';
  var errorBox = document.createElement('p');
  errorBox.style.cssText = 'max-width:36rem;margin:5rem auto;padding:1.5rem;color:#fecaca;background:#1e293b;border:1px solid #475569;font:14px/1.6 system-ui,sans-serif;';

  function showError(message) {
    errorBox.textContent = message;
    document.body.appendChild(errorBox);
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
    createRoot(document.getElementById('root')).render(React.createElement(componentModule.default));
  } catch (error) {
    showError('The Goals page could not load. Open it through GitHub Pages or a web server, not directly as a file. Details: ' + error.message);
  }
})();
