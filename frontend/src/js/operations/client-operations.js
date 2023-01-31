async function disconnectClientHandler(f7, client) {
  f7.dialog.confirm(
    `Disconnect the following client?<br>${client.name ? "Name: " + client.name + ",<br>" : ""
    }MAC: ${client.macaddr},<br>IP: ${client.ip_address}`,
    "Disconnect Client?",
    async () => {
      f7.preloader.show();
      let result = await central.disconnectUser({
        serial: client.associated_device,
        disconnect_user_mac: client.macaddr,
      });
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        let status = await central.getStatus({
          task_id: result.task_id,
        });
        if (status.state !== "QUEUED") {
          if (status.state === "SUCCESS") {
            f7.toast.show({
              text: `Client disconnected`,
              closeTimeout: 2000,
            });
          }
          f7.preloader.hide();
          break;
        }
      }
    }
  );
}

export {
  disconnectClientHandler as disconnectClientHandler
}
