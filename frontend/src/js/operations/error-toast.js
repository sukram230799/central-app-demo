function errorToast(f7, e, { defaultTimeout } = { defaultTimeout: 8000 }) {
  console.error(e);
  if (e?.options?.responseBody?.description)
    f7.toast.show({
      text: e.options.responseBody.description,
      closeTimeout: defaultTimeout,
    });
  else if (e?.name === 'AxiosError' || e?.name === 'HTTP Error') {
    f7.toast.show({
      text: "HTTP Error: " + e.message,
      closeTimeout: defaultTimeout,
    });
  }
  else if (e instanceof Error)
    f7.toast.show({
      text: e.name + ": " + e.message,
      closeTimeout: defaultTimeout,
    });
  else
    f7.toast.show({
      text: JSON.stringify(e),
      closeTimeout: defaultTimeout,
    });
}

export { errorToast }
