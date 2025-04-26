document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const circle = document.getElementById('circle');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const fullscreenBtn = document.getElementById('fullscreen-btn');
    const durationInput = document.getElementById('duration');
    const roundsInput = document.getElementById('rounds');
    const speedInput = document.getElementById('speed');
    const soundSelect = document.getElementById('sound');
    const circleSizeInput = document.getElementById('circle-size');
    const circleColorInput = document.getElementById('circle-color');
    const roundDisplay = document.getElementById('round-display');
    const timeDisplay = document.getElementById('time-display');
    const animationContainer = document.querySelector('.animation-container');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const acceptDisclaimerBtn = document.getElementById('accept-disclaimer');
    const toggleSettingsBtn = document.getElementById('toggle-settings');
    const settingsPanel = document.getElementById('settings-panel');
    const settingsArrow = toggleSettingsBtn.querySelector('.arrow');
    
    // Check if user has already accepted the disclaimer
    const hasAcceptedDisclaimer = localStorage.getItem('emdrDisclaimerAccepted');
    
    // Hide main content until disclaimer is accepted
    const container = document.querySelector('.container');
    if (!hasAcceptedDisclaimer) {
        container.style.display = 'none';
    } else {
        disclaimerModal.style.display = 'none';
    }
    
    // Handle disclaimer acceptance
    acceptDisclaimerBtn.addEventListener('click', function() {
        localStorage.setItem('emdrDisclaimerAccepted', 'true');
        disclaimerModal.style.display = 'none';
        container.style.display = 'block';
    });
    
    // Web Audio API for stereo sound
    let audioContext;
    try {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.error("Web Audio API is not supported in this browser");
    }
    let soundFile = 'tick.wav';
    let audioBuffer = null;
    let sourceNode = null;
    let pannerNode = null;
    
    // State variables
    let isRunning = false;
    let isPaused = false;
    let isRoundComplete = false;
    let currentRound = 0;
    let totalRounds = 0;
    let timeRemaining = 0;
    let animationDuration = 0;
    let timer;
    let animationInterval;
    let soundTimers = []; // Add array to track sound timers
    let lastPosition = 'left';
    
    // Load available sounds
    loadSounds();
    
    // Initialize
    function init() {
        totalRounds = parseInt(roundsInput.value);
        currentRound = 0;
        timeRemaining = parseInt(durationInput.value);
        animationDuration = calculateAnimationDuration();
        isRoundComplete = false;
        
        updateDisplay();
        updatePauseButton();
        updateCircleAppearance();
        
        // Reset animation and position to center
        circle.style.animation = 'none';
        circle.offsetHeight; // Force reflow
        
        // Update position based on current circle size
        const circleSize = parseInt(circleSizeInput.value);
        circle.style.left = `calc(50% - ${circleSize/2}px)`;
        lastPosition = 'center';
    }
    
    // Update circle size and color
    function updateCircleAppearance() {
        const size = circleSizeInput.value;
        const color = circleColorInput.value;
        const radius = size / 2;
        
        // Update CSS variables for the animation
        document.documentElement.style.setProperty('--circle-size', `${size}px`);
        document.documentElement.style.setProperty('--circle-radius', `${radius}px`);
        
        // Update circle appearance
        circle.style.width = `${size}px`;
        circle.style.height = `${size}px`;
        circle.style.backgroundColor = color;
    }
    
    // Update display elements
    function updateDisplay() {
        roundDisplay.textContent = `Round: ${currentRound} / ${totalRounds}`;
        timeDisplay.textContent = `Time: ${timeRemaining}s`;
    }
    
    // Update the pause/continue button
    function updatePauseButton() {
        if (isPaused || isRoundComplete) {
            pauseBtn.textContent = 'Continue';
            pauseBtn.classList.add('continue');
        } else {
            pauseBtn.textContent = 'Pause';
            pauseBtn.classList.remove('continue');
        }
    }
    
    // Calculate animation duration based on speed input
    function calculateAnimationDuration() {
        // Speed ranges from 1 (slowest) to 10 (fastest)
        // Convert to seconds for CSS animation
        return 6 - ((parseInt(speedInput.value) - 1) * 0.5);
    }
    
    // Start the animation
    function startAnimation() {
        const duration = calculateAnimationDuration();
        
        // Create dynamic keyframes that adjust based on circle size
        const circleSize = parseInt(circleSizeInput.value);
        const halfSize = circleSize / 2;
        
        // Reset any existing animation
        circle.style.animation = 'none';
        circle.offsetHeight; // Force reflow
        
        // Create a dynamic animation with proper circle positioning
        circle.style.animationName = 'bounce';
        circle.style.animationDuration = `${duration}s`;
        circle.style.animationTimingFunction = 'linear';
        circle.style.animationIterationCount = 'infinite';
        
        // Set initial position to center
        circle.style.left = `calc(50% - ${halfSize}px)`;
        
        // Set up animation event listeners instead of interval
        if (animationInterval) {
            clearTimeout(animationInterval);
        }
        
        // With the new 4-point animation (center-right-center-left-center), 
        // we need to play sound at 25% and 75% of the animation
        const quarterDuration = duration / 4 * 1000; // Convert to milliseconds
        
        // Schedule sound playing using the animation timing
        scheduleEdgeSounds();
        
        function scheduleEdgeSounds() {
            if (!isRunning) return;
            
            // We're starting from center, so schedule first sound at right edge (25% of duration)
            scheduleSound('right', quarterDuration);
            
            // Schedule second sound at left edge (75% of duration)
            scheduleSound('left', quarterDuration * 3);
            
            // Schedule next cycle
            animationInterval = setTimeout(() => {
                lastPosition = 'center';
                scheduleEdgeSounds();
            }, duration * 1000);
        }
        
        function scheduleSound(position, delay) {
            const timer = setTimeout(() => {
                if (!isRunning) return;
                playSound(position); // Pass position to control stereo panning
                lastPosition = position;
                // Remove this timer from the array once it's executed
                const index = soundTimers.indexOf(timer);
                if (index !== -1) soundTimers.splice(index, 1);
            }, delay);
            soundTimers.push(timer); // Track this timer
        }
    }
    
    // Play the sound with stereo panning (left/right)
    function playSound(position = 'center') {
        try {
            if (!audioContext) return;
            
            // Resume audioContext if it's suspended (needed for browser autoplay policies)
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            if (!audioBuffer) return;
            
            // Create new source and panner nodes for each sound
            sourceNode = audioContext.createBufferSource();
            sourceNode.buffer = audioBuffer;
            
            // Create stereo panner
            pannerNode = audioContext.createStereoPanner();
            
            // Set the pan based on the position
            // -1 = fully left, 0 = center, 1 = fully right
            if (position === 'left') {
                pannerNode.pan.value = -1;
            } else if (position === 'right') {
                pannerNode.pan.value = 1;
            } else {
                pannerNode.pan.value = 0;
            }
            
            // Connect nodes and play
            sourceNode.connect(pannerNode);
            pannerNode.connect(audioContext.destination);
            sourceNode.start();
        } catch (e) {
            console.log("Audio play failed:", e);
        }
    }
    
    // Load an audio file into buffer
    function loadAudioFile(url) {
        if (!audioContext) return;
        
        // On a live server, we can use fetch which is cleaner
        fetch(url)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => audioContext.decodeAudioData(arrayBuffer))
            .then(buffer => {
                audioBuffer = buffer;
            })
            .catch(error => {
                console.error('Error loading audio:', error);
                // Create a fallback empty buffer in case of error
                const emptyBuffer = audioContext.createBuffer(2, 44100, 44100);
                audioBuffer = emptyBuffer;
            });
    }
    
    // Load available sounds from the sounds directory
    function loadSounds() {
        // Try to fetch the list of files from the sounds directory
        fetch('sounds/')
            .then(response => response.text())
            .then(html => {
                // Parse HTML response to extract sound files
                const parser = new DOMParser();
                const doc = parser.parseFromString(html, 'text/html');
                const links = doc.querySelectorAll('a');
                
                // Filter for sound files
                const soundFiles = Array.from(links)
                    .map(link => link.href)
                    .filter(href => href.match(/\.(wav|mp3|ogg)$/))
                    .map(href => href.split('/').pop());
                
                // If no sounds found through HTML parsing, use default list
                if (soundFiles.length === 0) {
                    // Fallback sound list
                    const fallbackSounds = ['tick.wav', 'ping.wav', 'bing.wav', 'bloop_beep.wav', 'elevator_ding.wav'];
                    populateSoundDropdown(fallbackSounds);
                } else {
                    populateSoundDropdown(soundFiles);
                }
            })
            .catch(error => {
                console.error('Error loading sounds:', error);
                // Fallback sound list on error
                const fallbackSounds = ['tick.wav', 'ping.wav', 'bing.wav', 'bloop_beep.wav', 'elevator_ding.wav'];
                populateSoundDropdown(fallbackSounds);
            });
    }
    
    // Populate the sound dropdown with available sounds
    function populateSoundDropdown(soundFiles) {
        // Clear existing options
        soundSelect.innerHTML = '';
        
        // Add options for each sound file
        soundFiles.forEach(file => {
            const option = document.createElement('option');
            option.value = file;
            // Format the name: remove extension and capitalize
            const name = file.split('.')[0];
            option.textContent = name.charAt(0).toUpperCase() + name.slice(1);
            // Set tick.wav as the default selected option
            if (file.toLowerCase() === 'tick.wav') {
                option.selected = true;
            }
            soundSelect.appendChild(option);
        });
        
        // Set initial selection (either tick.wav or first option)
        if (soundSelect.options.length > 0) {
            soundFile = soundSelect.value;
            loadAudioFile(`sounds/${soundFile}`);
        }
        
        // Add event listener for sound change
        soundSelect.addEventListener('change', function() {
            soundFile = this.value;
            loadAudioFile(`sounds/${soundFile}`);
        });
    }
    
    // Set circle position to center
    function centerCircle() {
        const circleSize = parseInt(circleSizeInput.value);
        const halfSize = circleSize / 2;
        
        circle.style.animation = 'none';
        circle.offsetHeight; // Force reflow
        circle.style.left = `calc(50% - ${halfSize}px)`;
        lastPosition = 'center';
    }
    
    // Start or resume the session
    function toggleSession() {
        if (isPaused || isRoundComplete) {
            resumeSession();
        } else {
            pauseSession();
        }
    }
    
    // Start the session
    function startSession() {
        if (isPaused) {
            resumeSession();
        } else {
            init();
            currentRound = 1;
            isRunning = true;
            
            // Update UI
            startBtn.disabled = true;
            pauseBtn.disabled = false;
            durationInput.disabled = true;
            roundsInput.disabled = true;
            speedInput.disabled = true;
            circleSizeInput.disabled = true;
            circleColorInput.disabled = true;
            
            updateDisplay();
            updatePauseButton();
            
            // Start animation
            startAnimation();
            
            // Start timer
            startTimer();
        }
    }
    
    // Resume the session
    function resumeSession() {
        isRunning = true;
        isPaused = false;
        
        if (isRoundComplete) {
            isRoundComplete = false;
            currentRound++;
            timeRemaining = parseInt(durationInput.value);
            updateDisplay();
        }
        
        // Update UI
        startBtn.disabled = true;
        pauseBtn.disabled = false;
        updatePauseButton();
        
        // Resume animation
        startAnimation();
        
        // Resume timer
        startTimer();
    }
    
    // Start or resume the timer
    function startTimer() {
        if (timer) {
            clearInterval(timer);
        }
        
        timer = setInterval(function() {
            timeRemaining--;
            updateDisplay();
            
            if (timeRemaining <= 0) {
                // Round completed - pause and prepare for next round
                pauseForNextRound();
            }
        }, 1000);
    }
    
    // Helper function to clear all timers
    function clearAllTimers() {
        if (timer) clearInterval(timer);
        if (animationInterval) clearTimeout(animationInterval);
        
        // Clear all sound timers
        soundTimers.forEach(timerID => clearTimeout(timerID));
        soundTimers = [];
    }
    
    // Pause for next round
    function pauseForNextRound() {
        isRunning = false;
        isRoundComplete = true;
        
        // Clear all timers
        clearAllTimers();
        
        // Center the circle
        centerCircle();
        
        // Update UI
        if (currentRound >= totalRounds) {
            // All rounds completed
            endSession();
        } else {
            // Prepare for next round
            pauseBtn.disabled = false;
            updatePauseButton();
        }
    }
    
    // Pause the session
    function pauseSession() {
        isRunning = false;
        isPaused = true;
        
        // Clear all timers
        clearAllTimers();
        
        // Center the circle
        centerCircle();
        
        // Update UI
        updatePauseButton();
    }
    
    // End the session
    function endSession() {
        isRunning = false;
        isPaused = false;
        isRoundComplete = false;
        
        // Clear all timers
        clearAllTimers();
        
        // Center the circle
        centerCircle();
        
        // Update UI
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        durationInput.disabled = false;
        roundsInput.disabled = false;
        speedInput.disabled = false;
        circleSizeInput.disabled = false;
        circleColorInput.disabled = false;
        updatePauseButton();
    }
    
    // Reset the session
    function resetSession() {
        endSession();
        init();
    }
    
    // Toggle fullscreen minimalist mode
    function toggleFullscreenMode() {
        const body = document.body;
        
        // Toggle fullscreen mode
        if (!document.fullscreenElement) {
            // Save current circle size before entering fullscreen
            const currentSize = parseInt(circleSizeInput.value);
            
            // Enter fullscreen
            if (body.requestFullscreen) {
                body.requestFullscreen().catch(err => {
                    console.log(`Error attempting to enable fullscreen mode: ${err.message}`);
                });
            }
            
            // Apply fullscreen mode
            body.classList.add('fullscreen-mode');
            fullscreenBtn.textContent = '⛶';            
            
            // Increase circle size by 50% when in fullscreen mode if not running
            // If animation is running, we'll keep the current size to avoid disruption
            if (!isRunning) {
                // Store original size as a data attribute
                circle.dataset.originalSize = currentSize;
                
                // Apply larger size for fullscreen
                const fullscreenSize = Math.min(Math.floor(currentSize * 1.5), 150);
                circleSizeInput.value = fullscreenSize;
                updateCircleAppearance();
                centerCircle();
            }
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen().catch(err => {
                    console.log(`Error attempting to exit fullscreen mode: ${err.message}`);
                });
            }
            
            // Remove fullscreen mode class
            body.classList.remove('fullscreen-mode');
            fullscreenBtn.textContent = '⛶';
            
            // Restore original circle size if not running
            if (!isRunning && circle.dataset.originalSize) {
                circleSizeInput.value = circle.dataset.originalSize;
                updateCircleAppearance();
                centerCircle();
                delete circle.dataset.originalSize;
            }
        }
    }
    
    // Handle fullscreen change event (when user exits fullscreen via Escape key)
    document.addEventListener('fullscreenchange', function() {
        if (!document.fullscreenElement) {
            document.body.classList.remove('fullscreen-mode');
            fullscreenBtn.textContent = '⛶';
            
            // Restore original circle size if not running
            if (!isRunning && circle.dataset.originalSize) {
                circleSizeInput.value = circle.dataset.originalSize;
                updateCircleAppearance();
                centerCircle();
                delete circle.dataset.originalSize;
            }
        }
    });
    
    // Toggle settings panel
    function toggleSettings() {
        const isExpanded = toggleSettingsBtn.getAttribute('aria-expanded') === 'true';
        
        // Update button state
        toggleSettingsBtn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        
        // Toggle classes for animation
        settingsPanel.classList.toggle('collapsed', isExpanded);
        settingsArrow.classList.toggle('collapsed', isExpanded);
        
        // Save settings state in localStorage
        localStorage.setItem('emdrSettingsExpanded', isExpanded ? 'false' : 'true');
    }
    
    // Check if settings should be collapsed on load
    const settingsExpanded = localStorage.getItem('emdrSettingsExpanded');
    if (settingsExpanded === 'false') {
        toggleSettingsBtn.setAttribute('aria-expanded', 'false');
        settingsPanel.classList.add('collapsed');
        settingsArrow.classList.add('collapsed');
    }
    
    // Event listeners
    startBtn.addEventListener('click', startSession);
    pauseBtn.addEventListener('click', toggleSession);
    resetBtn.addEventListener('click', resetSession);
    fullscreenBtn.addEventListener('click', toggleFullscreenMode);
    toggleSettingsBtn.addEventListener('click', toggleSettings);
    
    // Circle appearance controls
    circleSizeInput.addEventListener('input', function() {
        updateCircleAppearance();
        // If the animation is paused, update the circle position immediately
        if (!isRunning && circle.style.animation === 'none') {
            const circleSize = parseInt(circleSizeInput.value);
            circle.style.left = `calc(50% - ${circleSize/2}px)`;
        }
    });
    
    circleColorInput.addEventListener('input', updateCircleAppearance);
    
    // When speed changes, update the animation if running
    speedInput.addEventListener('change', function() {
        if (isRunning) {
            const duration = calculateAnimationDuration();
            circle.style.animation = `bounce ${duration}s linear infinite`;
        }
    });
    
    // Add keyboard event listener for spacebar control
    document.addEventListener('keydown', function(event) {
        // Check if spacebar was pressed
        if (event.code === 'Space' || event.keyCode === 32) {
            // Prevent default spacebar behavior (like scrolling)
            event.preventDefault();
            
            // If start button is enabled, click it
            if (!startBtn.disabled) {
                startBtn.click();
                
                // Also resume audio context if suspended (browser autoplay policy)
                if (audioContext && audioContext.state === 'suspended') {
                    audioContext.resume();
                }
            }
            // Otherwise, if pause/continue button is enabled, click it
            else if (!pauseBtn.disabled) {
                pauseBtn.click();
            }
        }
    });
    
    // Event handler for any user interaction to enable audio
    function enableAudio() {
        if (audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
        document.removeEventListener('click', enableAudio);
        document.removeEventListener('keydown', enableAudio);
        document.removeEventListener('touchstart', enableAudio);
    }
    
    // Add event listeners to enable audio context on user interaction
    document.addEventListener('click', enableAudio);
    document.addEventListener('keydown', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    // Initialize on load
    init();
});
