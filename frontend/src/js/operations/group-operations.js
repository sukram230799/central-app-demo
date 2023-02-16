import { central } from '../central.js'

async function cloneGroupGetName(f7, callback, oldGroupName) {
  await central.ready();
  f7.dialog.prompt(
    "Please enter the name of the new group",
    "Clone Group",
    (newGroupName) => {
      if (newGroupName.length >= 0) {
        cloneGroupGetUpgrade(f7, callback, oldGroupName, newGroupName);
      } else
        f7.toast.show({ text: "Name can't be empty", closeTimeout: 2000 });
    }
  );
}

function cloneGroupGetUpgrade(f7, callback, oldGroupName, newGroupName) {
  f7.dialog
    .create({
      title: "Clone Group",
      text: "Upgrade Architecture?",
      buttons: [{ text: "Keep" }, { text: "Upgrade" }],
      onClick: (dialog, index) => {
        console.log(dialog);
        cloneGroupDisplay(f7, callback, oldGroupName, newGroupName, !!index);
      },
    })
    .open();
}

function cloneGroupDisplay(f7, callback, oldGroupName, newGroupName, upgradeArchitecture) {
  f7.preloader.show();
  central
    .cloneGroup({
      group: newGroupName,
      clone_group: oldGroupName,
      upgrade_architecture: upgradeArchitecture,
    })
    .then((message) => {
      f7.toast.show({ text: message, closeTimeout: 2000 })
      if (callback) callback(true, newGroupName);
    })
    .catch((e) => {
      console.error(e);
      f7.toast.show({
        text: e?.options?.responseBody?.description
          ? e.options.responseBody.description
          : JSON.stringify(e),
        closeTimeout: 8000,
      });
      if (callback) callback(false, newGroupName);
    })
    .finally(() => {
      f7.preloader.hide();
    });
}

function deleteGroupDialog(f7, callback, groupName) {
  f7.dialog
    .create({
      title: "Delete Group",
      text: `Delete "${groupName}"?`,
      buttons: [{ text: "Keep" }, { text: "Delete" }],
      onClick: (dialog, index) => {
        if (index) {
          f7.preloader.show();
          central.deleteGroup({ group: groupName })
            .then((message) => {
              if (callback) callback(true, groupName);
              f7.toast.show({ text: message, closeTimeout: 2000 })
            })
            .catch((e) => {
              console.error(e);
              f7.toast.show({
                text: e?.options?.responseBody?.description
                  ? e.options.responseBody.description
                  : JSON.stringify(e),
                closeTimeout: 8000,
              });
              if (callback) callback(false, groupName);
            })
            .finally(() => {
              f7.preloader.hide();
            });
        }
      },
    })
    .open();
}

export {
  cloneGroupGetName,
  cloneGroupGetUpgrade,
  cloneGroupDisplay,
  deleteGroupDialog,
}
