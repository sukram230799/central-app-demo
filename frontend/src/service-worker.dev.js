self.addEventListener('push', (event) => {
  let data = event.data.json();
  self.registration.showNotification(
    data.alert_type,
    {
      body: data.description
    }
  );
});
