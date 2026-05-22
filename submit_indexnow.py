import json
import xml.etree.ElementTree as ET
from pathlib import Path
from urllib import error, request

HOST = "fatedreel.com"
KEY = "b6f09cebefa4ecf4e122c262ba6097c6"
KEY_LOCATION = f"https://{HOST}/{KEY}.txt"
SITEMAP = Path("sitemap.xml")
ENDPOINT = "https://api.indexnow.org/indexnow"

namespace = {"sm": "http://www.sitemaps.org/schemas/sitemap/0.9"}
urls = [
    node.text
    for node in ET.parse(SITEMAP).getroot().findall("sm:url/sm:loc", namespace)
    if node.text
]
payload = {
    "host": HOST,
    "key": KEY,
    "keyLocation": KEY_LOCATION,
    "urlList": urls,
}
request_body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
indexnow_request = request.Request(
    ENDPOINT,
    data=request_body,
    headers={"Content-Type": "application/json; charset=utf-8"},
    method="POST",
)

try:
    with request.urlopen(indexnow_request, timeout=30) as response:
        print("IndexNow status:", response.status)
        print("Submitted URLs:", len(urls))
except error.HTTPError as exc:
    print("IndexNow error status:", exc.code)
    print(exc.read().decode("utf-8", "ignore"))
    raise
