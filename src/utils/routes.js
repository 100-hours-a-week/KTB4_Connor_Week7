const isPagesPage = globalThis.location.pathname.includes("/pages/");
const pagePrefix = isPagesPage ? "" : "pages/";
const rootPrefix = isPagesPage ? "../" : "";

const routes = {
  login: `${rootPrefix}index.html`,
  signup: `${pagePrefix}signup.html`,
  posts: `${pagePrefix}posts.html`,
  postCreate: `${pagePrefix}post-create.html`,
  postDetail(postId) {
    return `${pagePrefix}post-detail.html?postId=${encodeURIComponent(postId)}`;
  },
  postEdit(postId) {
    return `${pagePrefix}post-edit.html?postId=${encodeURIComponent(postId)}`;
  },
};

export { routes };
