const COMMON_REQUEST_FAILURE = "요청에 실패했습니다.";

const AUTH_LOGIN_FAILURE = "* 아이디 또는 비밀번호를 확인해주세요";
const AUTH_LOGIN_REQUIRED = "로그인이 필요합니다.";
const AUTH_EXPIRED = "로그인이 만료되었습니다. 다시 로그인해주세요.";
const AUTH_LOGOUT_FAILURE_LOG = "로그아웃 실패:";

const LOGIN_EMAIL_REQUIRED = "* 이메일을 입력해주세요.";
const LOGIN_EMAIL_FORMAT = "* 올바른 이메일 주소 형식을 입력해주세요.";
const LOGIN_PASSWORD_REQUIRED = "* 비밀번호를 입력해주세요";

const USER_NICKNAME_REQUIRED = "*닉네임을 입력해주세요.";
const USER_NICKNAME_SPACE = "*띄어쓰기를 없애주세요";
const USER_EMAIL_DUPLICATE = "*중복된 이메일 입니다.";
const USER_NICKNAME_DUPLICATE = "*중복된 닉네임 입니다.";

const PASSWORD_POLICY = "*비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다.";
const PASSWORD_REQUIRED = "*비밀번호를 입력해주세요";
const PASSWORD_CONFIRM_REQUIRED = "*비밀번호를 한번더 입력해주세요";
const PASSWORD_MISMATCH = "*비밀번호가 다릅니다.";
const PASSWORD_UPDATE_FAILURE = "*비밀번호 수정에 실패했습니다.";

const SIGNUP_EMAIL_REQUIRED = "*이메일을 입력해주세요.";
const SIGNUP_EMAIL_FORMAT = "*올바른 이메일 주소 형식을 입력해주세요. (예: example@example.com)";
const SIGNUP_EMAIL_SPACE = "*이메일에는 공백을 사용할 수 없습니다.";
const SIGNUP_PASSWORD_REQUIRED = "*비밀번호를 입력해주세요";
const SIGNUP_PASSWORD_CONFIRM_REQUIRED = "*비밀번호를 한번더 입력해주세요";
const SIGNUP_PASSWORD_MISMATCH = "*비밀번호가 다릅니다.";
const SIGNUP_PROFILE_REQUIRED = "*프로필 사진을 추가해주세요.";
const SIGNUP_FAILURE = "*회원가입에 실패했습니다. 다시 시도해주세요.";
const SIGNUP_NICKNAME_LENGTH = "*닉네임은 최대 10자까지 작성 가능합니다.";

const PROFILE_NICKNAME_LENGTH = "*닉네임은 최대 10자 까지 작성 가능합니다.";
const PROFILE_LOAD_FAILURE = "*회원정보를 불러오지 못했습니다.";
const PROFILE_UPDATE_FAILURE = "*회원정보 수정에 실패했습니다.";
const PROFILE_WITHDRAW_FAILURE = "*회원 탈퇴에 실패했습니다.";

const POSTS_LOAD_FAILURE = "* 게시글을 불러오지 못했습니다.";

const POST_LOAD_FAILURE = "*게시글을 불러오지 못했습니다.";
const POST_FORM_REQUIRED = "*제목, 내용을 모두 작성해주세요";
const POST_TITLE_REQUIRED = "*제목을 입력해주세요.";
const POST_CONTENT_REQUIRED = "*내용을 입력해주세요.";
const POST_CREATE_FAILURE = "*게시글 등록에 실패했습니다.";
const POST_EDIT_FAILURE = "*게시글 수정에 실패했습니다.";
const POST_NOT_FOUND = "*게시글 정보가 없습니다.";
const POST_NOT_FOUND_STATE = "게시글 정보가 없습니다.";

const COMMENT_REQUIRED = "*댓글을 입력해주세요.";
const COMMENT_FAILURE = "*댓글 처리에 실패했습니다.";

const IMAGE_UPLOAD_FAILURE = "*이미지 업로드에 실패했습니다.";

export {
    AUTH_EXPIRED,
    AUTH_LOGIN_FAILURE,
    AUTH_LOGIN_REQUIRED,
    AUTH_LOGOUT_FAILURE_LOG,
    COMMENT_FAILURE,
    COMMENT_REQUIRED,
    COMMON_REQUEST_FAILURE,
    IMAGE_UPLOAD_FAILURE,
    LOGIN_EMAIL_FORMAT,
    LOGIN_EMAIL_REQUIRED,
    LOGIN_PASSWORD_REQUIRED,
    PASSWORD_CONFIRM_REQUIRED,
    PASSWORD_MISMATCH,
    PASSWORD_POLICY,
    PASSWORD_REQUIRED,
    PASSWORD_UPDATE_FAILURE,
    POST_CONTENT_REQUIRED,
    POST_CREATE_FAILURE,
    POST_EDIT_FAILURE,
    POST_FORM_REQUIRED,
    POST_LOAD_FAILURE,
    POST_NOT_FOUND,
    POST_NOT_FOUND_STATE,
    POST_TITLE_REQUIRED,
    POSTS_LOAD_FAILURE,
    PROFILE_LOAD_FAILURE,
    PROFILE_NICKNAME_LENGTH,
    PROFILE_UPDATE_FAILURE,
    PROFILE_WITHDRAW_FAILURE,
    SIGNUP_EMAIL_FORMAT,
    SIGNUP_EMAIL_REQUIRED,
    SIGNUP_EMAIL_SPACE,
    SIGNUP_FAILURE,
    SIGNUP_NICKNAME_LENGTH,
    SIGNUP_PASSWORD_CONFIRM_REQUIRED,
    SIGNUP_PASSWORD_MISMATCH,
    SIGNUP_PASSWORD_REQUIRED,
    SIGNUP_PROFILE_REQUIRED,
    USER_EMAIL_DUPLICATE,
    USER_NICKNAME_DUPLICATE,
    USER_NICKNAME_REQUIRED,
    USER_NICKNAME_SPACE,
};
