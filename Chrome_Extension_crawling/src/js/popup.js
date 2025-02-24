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

    var userEmail = '';
    const form = document.getElementById('keyword-form');

    
    // 로그인된 계정 불러오기
    chrome.runtime.sendMessage({ action: "getUserInfo" }, (response) => {
        if (response.email != "") {
            document.getElementById("email").textContent = response.email
            userEmail = response.email.textContent;
        } else {
            document.getElementById("email").textContent = "로그인 정보 없음"
        }
    });


    // 키워드 모니터링 시작 클릭
    form.addEventListener('submit', function(event){
        event.preventDefault();

        const keywordInput = document.getElementById('keyword').value;
        const keyword = keywordInput.split(" ").join("");
        const date = new Date().toLocaleDateString();
        
        if(userEmail == ''){
            alert('이메일 로그인 후 진행해주세요.')
            return;
        }


        /* if(userEmail && keyword){
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
        } */
    });







});