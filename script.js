(function() {
    const DURATION_MINUTES = 30 // Total duration for the script to run
    const NEXT_BUTTON_MAX_CLICKS = 3 // Max number of clicks for the next button
    const DELAYS = { selectDropdown: 2000, waitForDate: 4000, clickNext: 4000, waitForRadio: 2000, clickSubmit: 2000, reload: 15000 } // Action delays

    let startTime = Date.now() // Record start time
    let lastReloadTime = Date.now() // Track last reload time
    let nextButtonClickCount = parseInt(localStorage.getItem('nextButtonClickCount')) || 0 // Restore next button click count from localStorage

    // Function to select the dropdown option that contains "HYDERABAD VAC"
    function selectDropdownOptionWithText(text) {
        const dropdown = document.evaluate('//*[@id="post_select"]', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        if (dropdown) {
            for (let i = 0; i < dropdown.options.length; i++) {
                if (dropdown.options[i].text.includes(text)) {
                    dropdown.selectedIndex = i // Set the selected index to the option that contains the text
                    dropdown.dispatchEvent(new Event('change')) // Dispatch change event if necessary
                    console.log('Selected dropdown option:', dropdown.options[i].text)
                    return
                }
            }
            console.log('Dropdown option with text not found:', text)
        } else {
            console.log('Dropdown not found')
        }
    }

    // Function to click the first available date across both calendars
    function clickAvailableDateOnBothCalendars() {
        const calendars = [
            document.evaluate('//*[@id="datepicker"]/div/div[1]/table/tbody/tr/td/a', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null),
            document.evaluate('//*[@id="datepicker"]/div/div[2]/table/tbody/tr/td/a', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        ];
        
        for (const calendar of calendars) {
            for (let i = 0; i < calendar.snapshotLength; i++) {
                const date = calendar.snapshotItem(i);
                if (date && !date.classList.contains('ui-state-disabled') && !date.classList.contains('redday')) {
                    date.click() // Click on the available date
                    console.log('Clicked on date:', date.textContent)
                    return true // Stop after clicking the first available date
                }
            }
        }
        console.log('No available dates to click on either calendar')
        return false
    }

    // Function to click the first available radio button
    function clickFirstAvailableRadioButton() {
        const radioButtons = document.evaluate('//*[@id="time_select"]/tbody/tr/td/div/label/input', document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null)
        for (let i = 0; i < radioButtons.snapshotLength; i++) {
            const radioButton = radioButtons.snapshotItem(i)
            if (radioButton && radioButton.offsetParent !== null) { // Check if the radio button is visible and clickable
                radioButton.click() // Click the first visible and clickable radio button
                console.log('Clicked radio button:', radioButton.parentElement.textContent.trim())
                return true // Indicate that a radio button was clicked
            }
        }
        console.log('No available radio buttons to click')
        return false
    }

    // Function to submit the form
    function submitForm(selector) {
        const submitButton = document.evaluate(selector, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        if (submitButton) {
            submitButton.click() // Click the submit button
            console.log('Form submitted')
        } else {
            console.log('Submit button not found')
        }
    }

    // Function to click the next button
    function clickNextButton() {
        const nextButton = document.evaluate('//*[@id="datepicker"]/div/div[2]/div/a/span', document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue
        if (nextButton) {
            nextButton.click() // Click the next button
            console.log('Clicked Next button')
            return true // Indicate that the next button was clicked
        }
        console.log('Next button not found')
        return false
    }

    // Function to wait for a specific duration
    function waitFor(ms) {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    // Main function to handle the process
    async function runBookingProcess() {
        while (Date.now() - startTime < DURATION_MINUTES * 60 * 1000) { // Run for the specified duration
            if (Date.now() - lastReloadTime >= DELAYS.reload) {
                location.reload() // Refresh the page if the time since last reload exceeds the reload interval
                lastReloadTime = Date.now() // Update last reload time
            }

            await waitFor(DELAYS.selectDropdown) // Wait for 2 seconds

            selectDropdownOptionWithText("HYDERABAD VAC") // Select the dropdown option that contains "HYDERABAD VAC"

            // Wait for the specified time before checking for available dates
            await waitFor(DELAYS.waitForDate)

            let dateClicked = clickAvailableDateOnBothCalendars() // Check for available dates on both calendars

            if (dateClicked) {
                await waitFor(DELAYS.waitForRadio) // Wait for the radio button to appear
                if (clickFirstAvailableRadioButton()) {
                    await waitFor(DELAYS.clickSubmit) // Wait before submitting
                    submitForm('//*[@id="submitbtn"]') // Submit button XPath
                }
            } else {
                while (nextButtonClickCount < NEXT_BUTTON_MAX_CLICKS) {
                    await waitFor(DELAYS.clickNext) // Wait before clicking next
                    if (clickNextButton()) {
                        nextButtonClickCount++ // Increment the counter for next button clicks
                        await waitFor(DELAYS.waitForDate) // Wait before checking dates again
                        dateClicked = clickAvailableDateOnBothCalendars() // Check again for available dates on both calendars
                        if (dateClicked) {
                            await waitFor(DELAYS.waitForRadio) // Wait for radio button
                            if (clickFirstAvailableRadioButton()) {
                                await waitFor(DELAYS.clickSubmit) // Wait before submitting
                                submitForm('//*[@id="submitbtn"]') // Submit button XPath
                            }
                            break // Exit the while loop if a date was clicked
                        }
                    }
                }

                // Reset the next button click count after max attempts
                if (nextButtonClickCount >= NEXT_BUTTON_MAX_CLICKS) {
                    localStorage.removeItem('nextButtonClickCount') // Clear count if max clicks reached
                    nextButtonClickCount = 0
                } else {
                    localStorage.setItem('nextButtonClickCount', nextButtonClickCount) // Save count to localStorage
                }
            }
        }

        console.log('Booking process completed')
        localStorage.removeItem('nextButtonClickCount') // Clear count after completion
    }

    // Start the process
    runBookingProcess()
})()
