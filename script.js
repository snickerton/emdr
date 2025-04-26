document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const circle = document.getElementById('circle');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const durationInput = document.getElementById('duration');
    const roundsInput = document.getElementById('rounds');
    const speedInput = document.getElementById('speed');
    const soundSelect = document.getElementById('sound');
    const roundDisplay = document.getElementById('round-display');
    const timeDisplay = document.getElementById('time-display');
    const animationContainer = document.querySelector('.animation-container');
    const disclaimerModal = document.getElementById('disclaimer-modal');
    const acceptDisclaimerBtn = document.getElementById('accept-disclaimer');
    
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
        
        // Reset animation and position to center
        circle.style.animation = 'none';
        circle.offsetHeight; // Force reflow
        circle.style.left = 'calc(50% - 25px)';
        lastPosition = 'center';
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
        circle.style.animation = `bounce ${duration}s linear infinite`;
        
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
            setTimeout(() => {
                if (!isRunning) return;
                playSound(position); // Pass position to control stereo panning
                lastPosition = position;
            }, delay);
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
        circle.style.animation = 'none';
        circle.offsetHeight; // Force reflow
        circle.style.left = 'calc(50% - 25px)';
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
    
    // Pause for next round
    function pauseForNextRound() {
        isRunning = false;
        isRoundComplete = true;
        
        // Clear timers
        clearInterval(timer);
        clearTimeout(animationInterval);
        
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
        
        // Clear timers
        clearInterval(timer);
        clearTimeout(animationInterval);
        
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
        
        // Clear timers
        clearInterval(timer);
        clearTimeout(animationInterval);
        
        // Center the circle
        centerCircle();
        
        // Update UI
        startBtn.disabled = false;
        pauseBtn.disabled = true;
        durationInput.disabled = false;
        roundsInput.disabled = false;
        speedInput.disabled = false;
        updatePauseButton();
    }
    
    // Reset the session
    function resetSession() {
        endSession();
        init();
    }
    
    // Event listeners
    startBtn.addEventListener('click', startSession);
    pauseBtn.addEventListener('click', toggleSession);
    resetBtn.addEventListener('click', resetSession);
    
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
