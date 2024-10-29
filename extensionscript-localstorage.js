// ==UserScript==
// @name         Booking Automation Script
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Automate booking process
// @author       Your Name
// @match        https://www.usvisascheduling.com/en-US/ofc-schedule/*
// @grant        none
// ==/UserScript==

(function() {
    const DURATION_MINUTES = 30; 
    const NEXT_BUTTON_MAX_CLICKS = 3;
    const DELAYS = { selectDropdown: 2000, waitForDate: 4000, clickNext: 4000, waitForRadio: 2000, clickSubmit: 2000, reload: 15000 };

    let startTime = Date.now();
    let lastReloadTime = Date.now();
    let nextButtonClickCount = 0; 

    async function runBookingProcess() {
        let userText = localStorage.getItem('selectedCity');
        if (!userText) {
            userText = prompt("Enter City (e.g., 'HYDERABAD VAC')", "HYDERABAD VAC");
            if (userText) {
                localStorage.setItem('selectedCity', userText); 
            } else {
                console.log("No city entered. Exiting script.");
                return; 
            }
        } else {
            console.log(`Using stored city: ${userText}`);
        }

        while (Date.now() - startTime < DURATION_MINUTES * 60 * 1000) { 
            if (Date.now() - lastReloadTime >= DELAYS.reload) {
                location.reload(); 
                lastReloadTime = Date.now(); 
            }

            await waitFor(DELAYS.selectDropdown);
            selectDropdownOptionWithText(userText);

            await waitFor(DELAYS.waitForDate);
            let dateClicked = clickAvailableDate(); 

            if (dateClicked) {
                await waitFor(DELAYS.waitForRadio);
                if (clickFirstAvailableRadioButton()) {
                    await waitFor(DELAYS.clickSubmit); 
                    submitForm('//*[@id="submitbtn"]'); 
                }
            } else {
                while (nextButtonClickCount < NEXT_BUTTON_MAX_CLICKS) {
                    await waitFor(DELAYS.clickNext);
                    if (clickNextButton()) {
                        nextButtonClickCount++; 
                        await waitFor(DELAYS.waitForDate);
                        dateClicked = clickAvailableDate(); 
                        if (dateClicked) {
                            await waitFor(DELAYS.waitForRadio);
                            if (clickFirstAvailableRadioButton()) {
                                await waitFor(DELAYS.clickSubmit); 
                                submitForm('//*[@id="submitbtn"]'); 
                            }
                            break; 
                        }
                    }
                }

                if (nextButtonClickCount >= NEXT_BUTTON_MAX_CLICKS) {
                    nextButtonClickCount = 0; 
                }
            }
        }

        console.log('Booking process completed');
    }

    function selectDropdownOptionWithText(text) {
        const dropdown = document.evaluate('//*[@id="post_select"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (dropdown) {
            for (let i = 0; i < dropdown.options.length; i++) {
                if (dropdown.options[i].text.includes(text)) {
                    dropdown.selectedIndex = i; 
                    dropdown.dispatchEvent(new Event('change')); 
                    console.log('Selected dropdown option:', dropdown.options[i].text);
                    return;
                }
            }
            console.log('Dropdown option with text not found:', text);
        } else {
            console.log('Dropdown not found');
        }
    }

    function clickAvailableDate() {
        const calendars = [
            '//*[@id="datepicker"]/div/div[1]/table/tbody/tr/td/a',
            '//*[@id="datepicker"]/div/div[2]/table/tbody/tr/td/a'
        ];
        for (const calendar of calendars) {
            const dates = document.evaluate(calendar, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
            for (let i = 0; i < dates.snapshotLength; i++) {
                const date = dates.snapshotItem(i);
                if (date && !date.classList.contains('ui-state-disabled') && !date.classList.contains('redday')) {
                    date.click(); 
                    console.log('Clicked on date:', date.textContent);
                    return true; 
                }
            }
        }
        console.log('No available dates to click');
        return false;
    }

    function clickFirstAvailableRadioButton() {
        const radioButtons = document.evaluate('//*[@id="time_select"]/tbody/tr/td/div/label/input', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
        for (let i = 0; i < radioButtons.snapshotLength; i++) {
            const radioButton = radioButtons.snapshotItem(i);
            if (radioButton && radioButton.offsetParent !== null) { 
                radioButton.click(); 
                console.log('Clicked radio button:', radioButton.parentElement.textContent.trim());
                return true; 
            }
        }
        console.log('No available radio buttons to click');
        return false;
    }

    // Function to submit the form
    function submitForm(selector) {
        const submitButton = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (submitButton) {
            submitButton.click(); 
            console.log('Form submitted');
        } else {
            console.log('Submit button not found');
        }
    }

    function clickNextButton() {
        const nextButton = document.evaluate('//*[@id="datepicker"]/div/div[2]/div/a/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;
        if (nextButton) {
            nextButton.click();
            console.log('Clicked Next button');
            return true; 
        }
        console.log('Next button not found');
        return false;
    }

    function waitFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    runBookingProcess();
})();
