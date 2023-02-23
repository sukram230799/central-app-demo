function errorToast(f7, e, { defaultTimeout } = { defaultTimeout: 8000 }) {
  if (e?.options?.responseBody?.description)
    f7.toast.show({
      text: e.options.responseBody.description,
      closeTimeout: defaultTimeout,
    });
  else if (e?.name === 'AxiosError') {
    f7.toast.show({
      text: "HTTPError: " + e.message,
      closeTimeout: defaultTimeout,
    });
  }
  else
    f7.toast.show({
      text: JSON.stringify(e),
      closeTimeout: defaultTimeout,
    });
}

export { errorToast }
