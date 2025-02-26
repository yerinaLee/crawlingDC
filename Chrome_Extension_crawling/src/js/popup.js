// 이메일 전송을 위한 EmailJS 설정
const EMAILJS_SERVICE_ID = 'service_vp0w3gb';
const EMAILJS_TEMPLATE_ID = 'template_4muc1u2';
const EMAILJS_PUBLIC_KEY = 'A3qWFk9TtvJI3KwbV';

// emailjs.init(EMAILJS_PUBLIC_KEY);

/* document.addEventListener('DOMContentLoaded', function(){
    const form = document.getElementById('keyword-form');
    const emailInput = document.getElementById('email');
    const keywordInput = document.getElementById('keyword');
    const keywordList = document.getElementById('keyword-list');
    const checkDBButton = document.getElementById('check-db');

    // 키워드 목록 로드
    chrome.storage.local.get(['keyword'], function(result){
        const keywords = result.keyword || [];
        keywords.forEach(item => {
            addKeywordToList(item.email, item.keyword, item.date);
        });
    });

    // 키워드 모니터링 시작 클릭
    form.addEventListener('submit', function(event){
        event.preventDefault();

        const email = emailInput.value.trim();
        const keyword = keywordInput.value.trim();
        const date = new Date().toLocaleDateString();

        if(email && keyword){
            chrome.storage.local.get(['keywords'], function(result){
                const keywords = result.keywords || [];

                // 중복 검사
                const exist = keywords.some(item => item.email === email && item.keyword === keyword);
                if(!exist){
                    keywords.push({email, keyword, date});
                    chrome.storage.local.set({keywords}, function(){
                        addKeywordToList(email, keyword, date);
                        emailInput.value = '';
                        keywordInput.value = '';
                    });
                } else {
                    alert('이미 등록된 키워드입니다!');
                }
            });
        }
    });


    // 키워드 목록에 추가
    function addKeywordToList(email, keyword, date){
        const li = document.createElement('li');
        li.textContent = `${email} - ${keyword} (${date} ~)`;

        const deleteButton = document.createElement('button');
        deleteButton.textContent = 'x';
        deleteButton.addEventListener('click', function() {
            chrome.storage.local.get(['keywords'], function(result){
                const keywords = result.keyword || [];
                const updatedKeywords = keywords.filter(item => !(item.email === email && item.keyword === keyword))
                chrome.storage.local.set({keywords : updatedKeywords}, function(){
                    li.remove();
                })
            })
        })

        li.appendChild(deleteButton);
        keywordList.appendChild(li);
    }

    // DB 확인 버튼
    checkDBButton.addEventListener('click', function(){
        chrome.storage.local.get(null, function(result){
            console.log('DB content:', result);
            alert(JSON.stringify(result, null, 2));
        });
    });
});

 */


document.addEventListener("DOMContentLoaded", function () {

    const form = document.getElementById('keyword-form');
    const keywordInput = document.getElementById('keyword');
    var userEmail = '';
    var keyword = '';

    
    // 로그인된 계정 불러오기
    chrome.runtime.sendMessage({ action: "getUserInfo" }, (response) => {
        if (response.email != "") {
            document.getElementById("email").textContent = response.email
            userEmail = response.email;
        } else {
            document.getElementById("email").textContent = "로그인 정보 없음"
        }
    });


    // 키워드 모니터링 시작 클릭
    form.addEventListener('submit', async function(event){

        event.preventDefault();

        keyword = keywordInput.value.split(" ").join("");
        const date = new Date().toLocaleDateString();
        
        if(userEmail == ''){
            alert('이메일 로그인 후 진행해주세요.')
            return;
        }

        if(keyword == ''){
            alert('키워드 입력 후 진행해주세요.')
            return;
        }


        // 키워드 저장 (이메일 - 키워드 - 시작날짜 - 새 글넘버) => 보안문제로 (k:v(키워드-시작날짜-새글넘버)) 로 변경
        // 저장시 중복검사
        // email 암호화....ㅎㅎㅎ
        // { "email":"abc@google.com", "keyword":"abc", "date_created":"2025-02-25", "no":2469 }
        // 삭제기능도 있어야겟고만...^^

        // get : (keys?: string | string[] | object, callback?: function) => {...}
        // remove  : (keys: string | string[], callback?: function) => {...}
        // set : (items: object, callback?: function) => {...}

        if(userEmail && keyword){

            // 중복검사
            const result = await getDataFromStorage(null);
            const keys = Object.keys(result);
            const exist = keys.some((key) => key === keyword);

            if(!exist){

                // 키워드의 최신글 불러오기
                const { latestPostId } = await getNewestPostId(keyword, 0);

                const data = {
                    // secretKey : secretKey,
                    // email : encryptedEmail,
                    // keyword : keyword,
                    date_created : date,
                    no : latestPostId
                }

                // DB 저장
                chrome.storage.sync.set({ [keyword] : data}, function(){

                    if (chrome.runtime.lastError) {
                        console.error("저장 중 오류 발생:", chrome.runtime.lastError);
                        alert('오류가 발생했습니다. 다시 시도해주세요.');

                    } else {
                        console.log("데이터 저장 완료!");
                        alert('키워드 모니터링이 시작되었습니다');
                        // addKeywordToList(email, keyword, date);

                        // 테스트용 -> 저장된 데이터 출력
                        chrome.storage.sync.get("keyword", function(result){
                            console.log("저장된 데이터:", result.keyword);
                            // {date_created: '2025. 2. 25.', email: 'abc@gmail.com', keyword: '페이백', no: 0}
                        })
                    }
                    keywordInput.value = '';
                });
                
            } else {
                alert('이미 등록된 키워드입니다!');
            }
        }
    });

});


/* 키워드로 최신글 no 가져오기 */
async function getNewestPostId(keyword, lastPostId) { 

    const BASE_URL = "https://gall.dcinside.com/mgallery/board/lists";

    const params = new URLSearchParams({
        id: 'closers_union',
        s_type: 'search_subject_memo',
        s_keyword: keyword
    });

    const response = await fetch(`${BASE_URL}?${params.toString()}`);
    const text = await response.text();

    const doc = new DOMParser().parseFromString(text, 'text/html');
    const articles = doc.querySelectorAll('tbody tr');
    let latestPostId = lastPostId; // 메서드에서 넘어온 글번호

    articles.forEach(article => {
        const postId = parseInt(article.querySelector('.gall_num')?.textContent.trim());

        if (postId > lastPostId) {
            if (postId > latestPostId) {
                latestPostId = postId;
            }
        }
    });

    return { latestPostId };
}



/* secret_key 생성 */
function generateSecretKey(){
    const array = new Uint8Array(32);
    window.crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
}


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


// email 암호화
// secret key 생성
// const secretKey = generateSecretKey();
// const encryptedEmail = CryptoJS.AES.encrypt(userEmail, secretKey).toString();

// 복호화 코드
// const bytes = CryptoJS.AES.decrypt(encryptedEmail, secretKey);
// const decryptedEmail = bytes.toString(CryptoJS.enc.Utf8);
