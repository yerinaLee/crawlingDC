// 이메일 전송을 위한 EmailJS 설정
const EMAILJS_SERVICE_ID = 'service_vp0w3gb';
const EMAILJS_TEMPLATE_ID = 'template_4muc1u2';
const EMAILJS_PUBLIC_KEY = 'A3qWFk9TtvJI3KwbV';

// emailjs.init(EMAILJS_PUBLIC_KEY);

document.addEventListener("DOMContentLoaded", async function () {

    const form = document.getElementById('keyword-form');
    const keywordInput = document.getElementById('keyword');
    const keywordList = document.getElementById('keyword-list');
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


    // 키워드 목록 로드
    const result = await getDataFromStorage(null);
    const savedKeys = Object.keys(result);

    savedKeys.forEach(item => {
        console.log(item)

        const keywordData = result[item];
        addKeywordToList(item);
    });


    // 키워드 모니터링 시작 클릭
    form.addEventListener('submit', async function(event){

        event.preventDefault();

        keyword = keywordInput.value.split(" ").join("");
        // const date = new Date().toLocaleDateString();
        
        if(userEmail == ''){
            alert('이메일 로그인 후 진행해주세요.')
            return;
        }

        if(keyword == ''){
            alert('키워드 입력 후 진행해주세요.')
            return;
        }


        if(userEmail && keyword){

            // 중복검사
            const result = await getDataFromStorage(null);
            const keys = Object.keys(result);
            const exist = keys.some((key) => key === keyword);

            if(!exist){

                // 키워드의 최신글 불러오기
                const { latestPostId } = await getNewestPostId(keyword, 0);

                const data = {
                    latest_post_id : latestPostId
                }

                // DB 저장
                chrome.storage.sync.set({ [keyword] : data}, function(){

                    if (chrome.runtime.lastError) {
                        console.error("저장 중 오류 발생:", chrome.runtime.lastError);
                        alert('오류가 발생했습니다. 다시 시도해주세요.');

                    } else {
                        console.log("데이터 저장 완료!");
                        alert('키워드 모니터링이 시작되었습니다');
                        addKeywordToList(keyword);

                        // 테스트용 -> 저장된 데이터 출력
                        // chrome.storage.sync.get("keyword", function(result){
                        //     console.log("저장된 데이터:", result.keyword);
                        //     // {date_created: '2025. 2. 25.', email: 'abc@gmail.com', keyword: '페이백', no: 0}
                        // })
                    }
                    keywordInput.value = '';
                });
                
            } else {
                alert('이미 등록된 키워드입니다!');
            }
        }
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


    // 키워드 목록에 추가
    function addKeywordToList(keyword){
        const li = document.createElement('li');
        const b = document.createElement('b');
        // const span = document.createElement('span');

        b.textContent = `${keyword}`
        // span.textContent = `(${date} ~)`

        li.appendChild(b);
        // li.appendChild(span);

        const deleteButton = document.createElement('button');
        deleteButton.id = keyword
        // deleteButton.classList.add('delete');

        const spanX = document.createElement('span');
        spanX.classList.add('delete');
        spanX.textContent = 'x';

        deleteButton.appendChild(spanX);

        li.appendChild(deleteButton);
        keywordList.appendChild(li);
    }


    // 키워드 삭제
    document.getElementById('keyword-list').addEventListener('click', function(event){
        if(event.target.classList.contains('delete')){
            const keyword = event.target.parentElement.id;

            chrome.storage.sync.remove(keyword, function(){
                if (chrome.runtime.lastError) {
                    console.error("스토리지 삭제 중 오류:", chrome.runtime.lastError);
    
                } else {
                    console.log(`${keyword} 삭제 완료`);
                    event.target.parentElement.parentElement.remove(); // 해당 키워드가 포함된 <li> 요소 삭제
                }
            });
        }
    })

});
