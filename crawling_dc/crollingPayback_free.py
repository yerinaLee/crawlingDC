import smtplib
from email.mime.text import MIMEText
import schedule
import time
import requests
from bs4 import BeautifulSoup
from pymongo import MongoClient
import os
from dotenv import load_dotenv
from tkinter import Tk, Label, Entry, Button

# 환경변수 로드
load_dotenv()

# MongoDB 연결 (환경변수에서 불러옴)
MONGO_URI = os.getenv('MONGO_URI')
client = MongoClient(MONGO_URI)
db = client.get_database('yeri')

# 이메일 설정 (환경변수에서 불러옴)
SMTP_SERVER = 'smtp.gmail.com'
SMTP_PORT = 587
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

def sendEmail(subject, message_list, alert_email):
    try:
        # 리스트를 문자열로 변환
        message = "\n".join(message_list)

        emailMessage = MIMEText(message, 'plain', 'utf-8')
        emailMessage['Subject'] = subject
        emailMessage['From'] = EMAIL_ADDRESS
        emailMessage['To'] = alert_email

        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server :
            server.starttls()
            server.login(user=EMAIL_ADDRESS, password=EMAIL_PASSWORD)
            server.sendmail(
                from_addr=EMAIL_ADDRESS,
                to_addrs=alert_email,
                msg= emailMessage.as_string()
            )
            print(f"알림 이메일 전송 완료: {subject}")

    except Exception as e:
        print(f"이메일 전송 실패: {e}")


# 크롤링 메서드
def crawlPayback(keyword, alert_email):
    BASE_URL = "https://gall.dcinside.com/mgallery/board/lists"

    # 헤더 설정
    headers = [
        {'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'}
    ]

    no = 0
    message = []

    # DB 최신 문서 넘버 불러오기
    doc_no_raw = db.crawling_dc.find_one({"keyword" : keyword})
    doc_no_db = doc_no_raw['doc_no'] if doc_no_raw else 0
    insert_db_flag = False

    # page 설정
    for i in range(1, 10):
        # 파라미터 설정
        params = {'id' : 'closers_union', 'page' : i, 's_type':'search_subject_memo', 's_keyword' : keyword}
        response = requests.get(BASE_URL, params=params, headers=headers[0])
        soup = BeautifulSoup(response.content, 'html.parser')
        article_list = soup.find('tbody').find_all('tr')

        
        # 한 페이지에 있는 모든 게시물 긁어옴
        for tr_item in article_list:
            doc_no_tag = tr_item.find('td', class_='gall_num')
            if not doc_no_tag:
                continue

            doc_no_now = int(doc_no_tag.text.strip())

            # 새 게시글이라면
            if int(doc_no_now) > int(doc_no_db) :

                # 가장 최신글 DB 업데이트
                if not insert_db_flag:
                    # db update
                    db.crawling_dc.update_one(
                        {"keyword" : keyword}, 
                        {"$set":{"doc_no":doc_no_now}},
                        upsert=True
                    )
                    
                    insert_db_flag = True

                # 메세지에 저장
                title_tag = tr_item.find('a', href=True)
                if title_tag:
                    title = title_tag.text.strip()
                    link = title_tag['href']
                    message.append(f"{no}. 제목: {title}\n링크: {link}\n")
                    no += 1

    if message :
        sendEmail(f"[알림] {keyword} 게시글", message, alert_email)
    else :
        print(time.strftime('%x %X'), "새 게시물 없음")



# GUI 설정
def startMonitoring():
    keyword = keyword_entry.get()
    alert_email = email_entry.get()

    if keyword and alert_email:
        print(f"키워드: {keyword}, 알림 이메일: {alert_email}")
        schedule.every(30).minutes.do(lambda: crawlPayback(keyword, alert_email))

        while True:
            schedule.run_pending()
            time.sleep(1)

    else:
        print("키워드와 이메일을 입력해주세요!")


# GUI 실행
root = Tk()
root.title("DC 모니터링")
root.geometry("300x150")

Label(root, text="모니터링 키워드").pack()
keyword_entry = Entry(root)
keyword_entry.pack()

Label(root, text="알림 받을 이메일 주소").pack()
email_entry = Entry(root)
email_entry.pack()

Button(root, text="모니터링 시작", command=startMonitoring).pack()

root.mainloop()