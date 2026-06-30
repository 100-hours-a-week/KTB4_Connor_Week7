const isPagesPage = globalThis.location.pathname.includes("/pages/");
const pagePrefix = isPagesPage ? "" : "pages/";
const rootPrefix = isPagesPage ? "../" : "";

const routes = {
  login: `${rootPrefix}index.html`,
};

export { routes };
