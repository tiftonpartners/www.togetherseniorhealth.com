from selenium import webdriver
import time
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.keys import Keys
from argparse import ArgumentParser
import os

AUTO_HOME = os.path.realpath(os.path.join(os.path.dirname(__file__), "."))


opt = Options()
opt.add_argument("--disable-infobars")
opt.add_argument("start-maximized")
opt.add_argument("--disable-extensions")
opt.add_argument("--no-sandbox")
opt.add_argument("--autoplay-policy=no-user-gesture-required")
opt.add_argument("use-fake-device-for-media-stream")
opt.add_argument("use-fake-ui-for-media-stream")
opt.add_argument(f"--use-file-for-fake-video-capture={AUTO_HOME}/fakevideo.y4m")
opt.add_argument(f"--use-file-for-fake-audio-capture={AUTO_HOME}/fakeaudio.wav")
# Pass the argument 1 to allow and 2 to block
opt.add_experimental_option("prefs", {
    "profile.default_content_setting_values.media_stream_mic": 1,
    "profile.default_content_setting_values.media_stream_camera": 1,
    "profile.default_content_setting_values.geolocation": 1,
    "profile.default_content_setting_values.notifications": 1
})
driver = webdriver.Chrome(chrome_options=opt, executable_path=AUTO_HOME + "/chromedriver91")

url = "https://mt1.test.tsh.care/session/agora/group/"
argparser = ArgumentParser('test_instructor.py -ts acronym')
argparser.add_argument('-m1', '--acronym', default="")
argparser.add_argument('-m2', '--duration', default="10")
args = argparser.parse_args()
acronym = args.acronym

duration = int(args.duration) * 60
print(f"duration time = {duration} seconds")
print(acronym)

driver.get(url="https://mt1.test.tsh.care/session/upcoming")
time.sleep(10)
elem = driver.find_element(by="xpath", value=".//input[@name='username']")
elem.send_keys("instructor5-auto@togetherseniorhealth.com")
elem = driver.find_element(by="xpath", value=".//input[@name='password']")
elem.send_keys("togethernow")
elem.send_keys(Keys.RETURN)
time.sleep(5)
driver.get(url=url + acronym)
time.sleep(60)
elem = driver.find_element(by="xpath", value=".//control-button[@toggleicon='record']")
elem.click()
time.sleep(10)


# Wait until class end
time.sleep(duration)
print(f"Time up! Quit browser to end class after {duration}")
driver.quit()
