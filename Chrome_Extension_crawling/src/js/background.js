/* // 백그라운드 스크립트
const BASE_URL = "https://gall.dcinside.com/mgallery/board/lists";

// 이메일 전송을 위한 EmailJS 설정
const EMAILJS_SERVICE_ID = 'service_vp0w3gb';
const EMAILJS_TEMPLATE_ID = 'template_4muc1u2';
const EMAILJS_PUBLIC_KEY = 'A3qWFk9TtvJI3KwbV';

// 크롤링 함수
async function checkForNewPosts(keyword, lastPostId) {
    const params = new URLSearchParams({
        id: 'closers_union',
        s_type: 'search_subject_memo',
        s_keyword: keyword
    });
    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    const text = await response.text();

    const doc = new DOMParser().parseFromString(text, 'text/html');
    const articles = doc.querySelectorAll('tbody tr');
    let latestPostId = lastPostId;
    let newPosts = [];

    articles.forEach(article => {
        const postId = parseInt(article.querySelector('.gall_num')?.textContent.trim());
        const title = article.querySelector('a').textContent.trim();
        const link = article.querySelector('a').href;

        if (postId > lastPostId) {
            newPosts.push({ title, link });
            if (postId > latestPostId) {
                latestPostId = postId;
            }
        }
    });

    return { newPosts, latestPostId };
}

// 새 게시글 발견 시 이메일 전송 + 크롬 알림
function notifyUser(posts, email) {
    posts.forEach(post => {
        chrome.notifications.create({
            type: 'basic',
            iconUrl: 'icon.png',
            title: '새 DC 게시글 알림',
            message: `${post.title}\n${post.link}`
        });

        // 이메일 전송
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            subject: '새 DC 게시글 알림',
            message: `${post.title}\n${post.link}`
        }, EMAILJS_PUBLIC_KEY)
        .then(() => console.log('Email sent successfully!'))
        .catch(error => console.error('Email sending failed:', error));
    });
}

// 주기적으로 새 글 체크
chrome.alarms.create('checkDCInside', { periodInMinutes: 30 });

chrome.alarms.onAlarm.addListener(alarm => {
    if (alarm.name === 'checkDCInside') {
        chrome.storage.local.get(['keyword', 'email', 'lastPostId'], async (data) => {
            if (data.keyword && data.email) {
                const { newPosts, latestPostId } = await checkForNewPosts(data.keyword, data.lastPostId || 0);
                if (newPosts.length > 0) {
                    notifyUser(newPosts, data.email);
                    chrome.storage.local.set({ lastPostId: latestPostId });
                }
            }
        });
    }
});

 */



/* 유저 계정 정보 가져오는 TypeScript */
/* 
// background.ts
function getUserProfile(): void {
    chrome.identity.getProfileUserInfo((userInfo) => {
      console.log('User ID:', userInfo.id);
      console.log('User Email:', userInfo.email);
    });
  }
  
  function authenticateAndFetchProfile(): void {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        console.error('Error:', chrome.runtime.lastError.message);
      } else {
        getUserProfile();
      }
    });
  }
  
  // 크롬 확장 프로그램이 시작될 때 프로파일 정보를 가져옴
  chrome.runtime.onInstalled.addListener(() => {
    authenticateAndFetchProfile();
  }); */




/* // 📄 background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'new_post') {
        const { email, keyword, title } = message;

        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            subject: `키워드 [${keyword}] 관련 새 글 알림`,
            message: `DC에서 새로운 게시물이 등록되었습니다! 제목: ${title}`
        }).then(() => {
            console.log('Email sent successfully!');
        }).catch((error) => {
            console.error('Email sending failed:', error);
        });

        chrome.notifications.create('', {
            type: 'basic',
            iconUrl: 'src/img/crawling_icon.png',
            title: '새 글 알림',
            message: `키워드 [${keyword}] 관련 새 글: ${title}`
        });
    }
}); */


// 크롬에 로그인된 계정정보 가져오는 코드
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "getUserInfo"){
        chrome.identity.getProfileUserInfo({ accountStatus:"ANY"}, (userInfo) => {
            console.log("User Info : ", userInfo);
            sendResponse(userInfo);
        });
        return true; // 비동기응답을 위한 true 반환
    }
})


