from flask import Flask, request, jsonify
import smtplib
from email.mime.text import MIMEText
import requests
from bs4 import BeautifulSoup
import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv('MONGO_URI')
EMAIL_ADDRESS = os.getenv('EMAIL_ADDRESS')
EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD')

client = MongoClient(MONGO_URI)
db = client.get_database('yeri')

app = Flask(__name__)

def send_email(subject, message, alert_email):
    msg = MIMEText(message, 'plain', 'utf-8')
    msg['Subject'] = subject
    msg['From'] = EMAIL_ADDRESS
    msg['To'] = alert_email

    with smtplib.SMTP('smtp.gmail.com', 587) as server:
        server.starttls()
        server.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
        server.sendmail(EMAIL_ADDRESS, alert_email, msg.as_string())

def crawl_dc(keyword):
    BASE_URL = "https://gall.dcinside.com/mgallery/board/lists"
    params = {'id': 'closers_union', 's_type': 'search_subject_memo', 's_keyword': keyword}
    response = requests.get(BASE_URL, params=params)
    soup = BeautifulSoup(response.content, 'html.parser')

    articles = []
    for tr in soup.find('tbody').find_all('tr'):
        title_tag = tr.find('a', href=True)
        if title_tag:
            title = title_tag.text.strip()
            link = f"https://gall.dcinside.com{title_tag['href']}"
            articles.append(f"{title}\n{link}")

    return articles

@app.route('/crawl', methods=['GET'])
def crawl():
    keyword = request.args.get('keyword')
    email = request.args.get('email')

    if not keyword or not email:
        return jsonify({'error': 'Missing keyword or email'}), 400

    articles = crawl_dc(keyword)

    if articles:
        send_email(f"[알림] {keyword} 게시글", "\n".join(articles), email)
        return jsonify({'message': 'Email sent with new articles!'})
    else:
        return jsonify({'message': 'No new articles.'})

if __name__ == '__main__':
    app.run(port=5000)
