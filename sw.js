self.addEventListener('install',event=>{
 event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate',event=>{
 event.waitUntil(self.clients.claim());
});

self.addEventListener('notificationclick',event=>{
 event.notification.close();
 event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(windowClients=>{
  for(const client of windowClients){
   if('focus' in client) return client.focus();
  }
  return clients.openWindow('./');
 }));
});
