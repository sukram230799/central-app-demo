import { central } from "../central";

async function blinkLEDHandler(f7, serial, ledBlinking) {
  f7.preloader.show();
  try {
    let result;
    console.log(`LED Blink, current state ${ledBlinking ? "On" : "Off"}`);

    if (!ledBlinking)
      result = await central.blinkLEDOn({ serial: serial });
    else
      result = await central.blinkLEDOff({
        serial: serial,
      });

    for (let i = 1; i <= 10; i++) {
      await new Promise((resolve) => setTimeout(resolve, i * 1000));
      let status = await central.getStatus({
        task_id: result.task_id,
      });
      if (status.state !== "QUEUED") {
        if (status.state === "SUCCESS") {
          ledBlinking = !ledBlinking;
          f7.toast.show({
            text: `Led turned ${ledBlinking ? "on" : "off"}`,
            closeTimeout: 2000,
          });
        }
        break;
      }
    }
  } catch (e) {
    console.log(e);
    f7.toast.show({
      text: e?.options?.responseBody?.description
        ? e.options.responseBody.description
        : JSON.stringify(e),
      closeTimeout: 8000,
    });
  } finally {
    f7.preloader.hide();
    return ledBlinking;
  }
}

export {
  blinkLEDHandler as blinkLEDHandler,
}
