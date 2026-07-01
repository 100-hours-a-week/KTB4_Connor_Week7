import { fetchPosts } from "../api/posts.js";
import { createHeaderProfile } from "../components/header-profile.js";
import { routes } from "../utils/routes.js";
import { formatCount, formatDate, formatLimitText } from "../utils/format.js";
import { resolveImageUrl } from "../utils/image.js";
import { POSTS_LOAD_FAILURE } from "../constants/messages.js";


const PAGE_SIZE = 10;
const TITLE_MAX_LENGTH = 26;

const postsList = document.querySelector(".posts-list");
const postsState = document.querySelector(".posts-state");
const sentinel = document.querySelector(".posts-sentinel");
const writeLink = document.querySelector(".write-link");

const headerProfile = createHeaderProfile();
const pageState = {
    nextCursor: null,
    hasNext: true,
    isLoading: false,
    loadedCount: 0,
};
let postsObserver = null;

function showState(message) {
    postsState.textContent = message;
    postsState.hidden = !message;
}

function stopObservingPosts() {
    postsObserver?.disconnect?.();
}

function createAuthorAvatar(post) {
    const imageUrl = resolveImageUrl(post.profileImage || post.authorProfileImage);
    const avatar = document.createElement("span");
    avatar.className = "post-author-avatar";

    if (!imageUrl) {
        return avatar;
    }

    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "";
    avatar.append(image);

    return avatar;
}

function createPostCard(post) {
    const card = document.createElement("a");
    card.className = "post-card";
    card.href = routes.postDetail(post.postId);

    const body = document.createElement("div");
    body.className = "post-card-body";

    const title = document.createElement("h3");
    title.textContent = formatLimitText(post.title, TITLE_MAX_LENGTH);

    const meta = document.createElement("div");
    meta.className = "post-meta";

    const stats = document.createElement("span");
    stats.textContent = `좋아요 ${formatCount(post.likeCount)}   댓글 ${formatCount(post.commentCount)}   조회수 ${formatCount(post.viewCount)}`;

    const date = document.createElement("time");
    date.dateTime = post.createdAt || "";
    date.textContent = formatDate(post.createdAt);

    meta.append(stats, date);
    body.append(title, meta);

    const footer = document.createElement("div");
    footer.className = "post-card-footer";

    const nickname = document.createElement("strong");
    nickname.textContent = post.nickname || "알 수 없음";

    footer.append(createAuthorAvatar(post), nickname);
    card.append(body, footer);

    return card;
}

function renderPosts(posts) {
    const fragment = document.createDocumentFragment();

    posts.forEach((post) => {
        fragment.append(createPostCard(post));
    });

    postsList.append(fragment);
}

async function loadPosts() {
    if (pageState.isLoading || !pageState.hasNext) {
        return;
    }

    pageState.isLoading = true;
    showState(pageState.loadedCount === 0 ? "게시글을 불러오는 중입니다." : "");

    try {
        const data = await fetchPosts({
            cursor: pageState.nextCursor,
            size: PAGE_SIZE,
        });
        const posts = Array.isArray(data.posts) ? data.posts : [];

        renderPosts(posts);
        pageState.loadedCount += posts.length;
        pageState.nextCursor = data.nextCursor || null;
        pageState.hasNext = Boolean(data.hasNext);

        showState(pageState.loadedCount === 0 ? "게시글이 없습니다." : "");
    } catch (error) {
        pageState.hasNext = false;
        showState(error.message || POSTS_LOAD_FAILURE);
    } finally {
        pageState.isLoading = false;

        if (!pageState.hasNext) {
            stopObservingPosts();
        }
    }
}

headerProfile.loadCurrentUser();
loadPosts();

writeLink.addEventListener("click", (event) => {
    if (headerProfile.isAuthenticated()) {
        return;
    }

    event.preventDefault();
    globalThis.location.href = routes.login;
});

postsObserver = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
        loadPosts();
    }
});

postsObserver.observe(sentinel);
