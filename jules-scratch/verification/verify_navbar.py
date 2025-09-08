from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch()
    page = browser.new_page()
    try:
        page.goto("http://localhost:5173/")
        page.screenshot(path="jules-scratch/verification/verification.png")
    finally:
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
