import smtplib
from email.mime.text import MIMEText
import schedule
import time
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import pprint

# 몽고DB 연결
client = MongoClient('mongodb+srv://yeri042924:rSkvmw2wJhONmPsD@yerimongo.d7did.mongodb.net/?retryWrites=true&w=majority&appName=yeriMongo')
db = client.yeri

# Dictionary set
doc = {
    'doc_no' : '2975',
    'keyword' : '페이백',
    'site' : '디씨'
}

# db insert
# db.crawling_dc_payback.insert_one(doc)


# db select
# pprint.pprint(db.crawling.find_one())  #{'_id': ObjectId('67a5c433f334076e195256db'), 'age': 36, 'name': '예리'}

# age = db.crawling.find_one({}, {"age":1, "_id":0})
# print(age["age"]) #36



# 이메일 설정
SMTP_SERVER = 'smtp.gmail.com'
# SMTP_PORT = 587
EMAIL_ADDRESS = 'yeri042924@gmail.com'
EMAIL_PASSWORD = 'mzji riuu juma uqbv'
ALERT_EMAIL = 'yeri@mangot5.com'
KEYWORD = '페이백'

def sendEmail(subject, message_list):
    try:
        # 리스트를 문자열로 변환
        message = "\n".join(message_list)

        emailMessage = MIMEText(message, 'plain', 'utf-8')
        emailMessage['Subject'] = subject
        emailMessage['From'] = EMAIL_ADDRESS
        emailMessage['To'] = ALERT_EMAIL

        with smtplib.SMTP(SMTP_SERVER) as server :
            server.starttls()
            server.login(user=EMAIL_ADDRESS, password=EMAIL_PASSWORD)
            
            server.sendmail(
                from_addr=EMAIL_ADDRESS,
                to_addrs=ALERT_EMAIL,
                msg= emailMessage.as_string()
            )
            print(f"알림 이메일 전송 완료: {subject}")

    except Exception as e:
        print(f"이메일 전송 실패: {e}")


def crawlPayback():

    BASE_URL = "https://gall.dcinside.com/mgallery/board/lists"

    # 헤더 설정
    headers = [
        {'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'}
    ]

    no = 0
    message = []

    # DB 최신 문서 넘버 불러오기
    doc_no_raw = db.crawling_dc_payback.find_one({}, {"doc_no":1, "_id":0})
    doc_no_db = 0
    
    if int(doc_no_raw["doc_no"]) > 0 :
        doc_no_db = doc_no_raw["doc_no"]

    insert_db_flag = False

    # page 설정
    for i in range(1, 10):
        # 파라미터 설정
        params = {'id' : 'closers_union', 'page' : i, 's_type':'search_subject_memo', 's_keyword' : '페이백'}
        response = requests.get(BASE_URL, params=params, headers=headers[0])

        soup = BeautifulSoup(response.content, 'html.parser')

        article_list = soup.find('tbody').find_all('tr')

        

        # 한 페이지에 있는 모든 게시물 긁어옴
        for tr_item in article_list:
            doc_no = tr_item.find('td', class_='gall_num')
            doc_no_now = doc_no.text

            # 새 게시글이라면
            if int(doc_no_now) > int(doc_no_db) :

                # 가장 최신글 DB 업데이트
                if(insert_db_flag == False) :

                    # db update
                    db.crawling_dc_payback.update_one({"keyword" : "페이백"}, {"$set":{"doc_no":doc_no_now}})
                    
                    insert_db_flag = True


                # 메세지에 저장
                title_tag = tr_item.find('a', href=True)
                title = title_tag.text
                link = title_tag['href']

                message.append(f"{no}. 제목 : {title}\n링크 : {link}\n\n")
                # print("제목: ", title)
                # print("주소: ", link)

                no+=1


    if(message != []) :
        sendEmail(f"[알림] 페이백 게시글", message)    
    else :
        print(time.strftime('%x %X'), "새 게시물 없음")

#10분마다 실행
schedule.every(30).minutes.do(crawlPayback)

if __name__ == "__main__":
    print("크롤링 시작 ............................................................ ")
    crawlPayback()
    while True:
        schedule.run_pending()
        time.sleep(1)




