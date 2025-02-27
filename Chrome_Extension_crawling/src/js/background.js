// import cheerio from 'cheerio';

const BASE_URL = "https://gall.dcinside.com/mgallery/board/lists";
const CONTENT_BASE_URL = "https://gall.dcinside.com";

// 이메일 전송을 위한 EmailJS 설정
const EMAILJS_SERVICE_ID = 'service_vp0w3gb';
const EMAILJS_TEMPLATE_ID = 'template_4muc1u2';
const EMAILJS_PUBLIC_KEY = 'A3qWFk9TtvJI3KwbV';

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


// 크롤링 함수
async function checkForNewPosts(keyword, lastPostId) {

    // 업데이트 테스트 코드
    // const updatedData = {
    //     // latest_post_id: latestPostId 
    //     latest_post_id: 0
    // };

    // chrome.storage.sync.set({ "페이백": updatedData }, function () {});

    const params = new URLSearchParams({
        id: 'closers_union',
        s_type: 'search_subject_memo',
        s_keyword: keyword
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    const text = await response.text();

    let latestPostId = lastPostId;
    let newPosts = [];

    // 게시글 정보 추출
    const gallListMatch = text.match(/<table[^>]*class="gall_list"[^>]*>(.*?)<\/table>/s);
    if (!gallListMatch) {
        console.error("검색목록이 없습니다.");
        return { newPosts, latestPostId };
    }
    const gallListHTML = gallListMatch[1];


    // 게시글 정보 추출 (정규식 기반)
    const postMatches = [...gallListHTML.matchAll(/<tr[^>]*>.*?<td class="gall_num">(\d+)<\/td>.*?<a[^>]*href="([^"]+)"[^>]*>(.*?)<\/a>/gs)];

    postMatches.forEach(match => {
        const postId = parseInt(match[1], );
        const link = match[2].startsWith('http') ? match[2] : `${CONTENT_BASE_URL}${match[2]}`;
        const title = match[3].trim();

        console.log("postId : " + postId)
        console.log("link : " + link)
        console.log("title : " + title)

        if (postId > lastPostId) {
            newPosts.push({ title, link });
            console.log("newPosts 1 : " + newPosts);
            if (postId > latestPostId) {
                latestPostId = postId;
            }
        }
    })

    return { newPosts, latestPostId };
}




// 주기적으로 새 글 체크
chrome.alarms.create('checkDCInside', { periodInMinutes: 0.2 });

chrome.alarms.onAlarm.addListener(async alarm => {
    console.log("시작!!!!")

    if (alarm.name === 'checkDCInside') {

        chrome.storage.sync.get(null, async (data) => {

            // 키워드(k) 한바퀴씩 돌면서, 새글이 올라와있으면 메일 보내고, storage 업데이트하기
            const keys = Object.keys(data);

            if(keys.length > 0){

                for(const key of keys){
                    const keywordData = data[key];

                    try {
                        const result = await checkForNewPosts(key, keywordData.latest_post_id || 0);

                        console.log("result : " + result)

                        if(!result){
                            console.error("checkForNewPosts() 실행 중 오류 발생!");
                            continue;
                        }

                        const {newPosts, latestPostId} = result;

                        console.log("newPosts : " + newPosts)
                        console.log("latestPostId : " + latestPostId)

                        if (newPosts.length > 0) {
                            // notifyUser(newPosts, data.email);

                            const updatedData = {
                                latest_post_id: latestPostId 
                            };

                            chrome.storage.sync.set({ [key]: updatedData }, function () { // 여기서 데이터 하나만 업데이트되는지도 봐야함
                                console.log(`Storage Updated: ${key}`);
                            });
                        }
                    } catch (error){
                        console.error(`checkForNewPosts() 오류: ${error.message}`);
                    }
                }
            }

        });
    }
});



/* // background.js
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
            sendResponse(userInfo);
        });
        return true; // 비동기응답을 위한 true 반환
    }
})


/* storage 에서 key로 value 불러오기 */
function getDataFromStorage(keys){
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(keys, function(result){
            if (chrome.runtime.lastError) {
                reject(chrome.runtime.lastError);
            } else {
                resolve(result);
            }
        });
    })
}

