import smtplib
import schedule

import time
import requests
from urllib import request
from bs4 import BeautifulSoup


# ============================= 디씨 get==============================
BASE_URL = "https://gall.dcinside.com/mgallery/board/lists"
ARTICLE_BASE_URL = "https://gall.dcinside.com"

# 헤더 설정
headers = [
    {'User-Agent' : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36'}
]

# page 설정
for i in range(1, 10):
    # 파라미터 설정
    params = {'id' : 'closers_union', 'page' : i, 's_type':'search_subject_memo', 's_keyword' : '페이백'}
    response = requests.get(BASE_URL, params=params, headers=headers[0])

    soup = BeautifulSoup(response.content, 'html.parser')

    article_list = soup.find('tbody').find_all('tr')

    # 한 페이지에 있는 모든 게시물 긁어옴
    for tr_item in article_list:
        title_tag = tr_item.find('a', href=True)
        title = title_tag.text

        print("제목: ", title)
        print("주소: ", title_tag['href'])






# 작동 성공 (네이버뉴스)
# def crawler(soup):
#     div = soup.find("div", class_="list_body")
#     result = []

#     for a in div.find_all("a"):
#         result.append(a.get_text())
#     return result

# def main():
#     custom_header = {
#         'referer' : 'https://www.naver.com/',
#         'user-agent' : 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 Safari/537.36'
#     }

#     url = "https://news.naver.com/main/list.naver?mode=LPOD&mid=sec&sid1=001&sid2=140&oid=001&isYeonhapFlash=Y&aid=0015198348"
#     req = requests.get(url, headers=custom_header)
#     soup = BeautifulSoup(req.text, "html.parser")
#     result = crawler(soup)
#     print(result)

# if __name__ == "__main__":
#     main()