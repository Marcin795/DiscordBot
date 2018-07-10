import urllib.request
import ssl
from requests_html import HTML
import requests
import json

with open('settings.json') as json_data:
    d = json.load(json_data)


WAT_STR = 'https://s1.wcy.wat.edu.pl/ed/'

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

r = urllib.request.urlopen('https://s1.wcy.wat.edu.pl/ed/', context=ctx)
data = r.read().decode('windows-1252')

html = HTML(html=data)
sid=html.search('sid={}>')[0]
STR = "https://s1.wcy.wat.edu.pl/ed/logged_inc.php?sid="+sid+"&mid=328&iid=20175&exv=" + d['group'] + "&pos=267.75&rdo=1&t=6801377"


data = [
    ("sid", sid),
    ('formname', 'login'),
    ('default_fun', '1'),
    ('userid', d["login"]),
    ('password', d["password"]),
    ('view_height', '1080'),
    ('view_width', '1920'),
]


#req = urllib.request.Request('https://s1.wcy.wat.edu.pl/ed/index.php?sid='+sid)
#req.add_header('Content-Type', 'application/x-www-form-urlencoded')
#r = urllib.request.urlopen(req, context=ctx, data = data)

#print(sid)
response = requests.post(WAT_STR+"index.php",verify=False, data=data)

#req = urllib.request.urlopen(STR, context=ctx)

req = urllib.request.urlopen("https://s1.wcy.wat.edu.pl/ed/logged_inc.php?sid="+sid+"&mid=328&iid=20175&exv=" + d["group"] + "&pos=279.29998779296875&rdo=1&t=6801378", context=ctx)
req = urllib.request.urlopen("https://s1.wcy.wat.edu.pl/ed/logged.php?sid="+sid+"&mid=328&iid=20175&vrf=32820175&rdo=1&pos=210.5&exv=" + d["group"] + "&opr=DTXT", context=ctx)
#print(req.geturl())
req = urllib.request.urlopen(req.geturl(), context=ctx)

html = req.read()

print(html)
