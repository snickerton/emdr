document.addEventListener('DOMContentLoaded', function() {
    // DOM Elements
    const circle = document.getElementById('circle');
    const startBtn = document.getElementById('start-btn');
    const pauseBtn = document.getElementById('pause-btn');
    const resetBtn = document.getElementById('reset-btn');
    const durationInput = document.getElementById('duration');
    const roundsInput = document.getElementById('rounds');
    const speedInput = document.getElementById('speed');
    const roundDisplay = document.getElementById('round-display');
    const timeDisplay = document.getElementById('time-display');
    const animationContainer = document.querySelector('.animation-container');
    
    // Audio element
    const tickSound = new Audio('sounds/tick.wav');
    
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
                playSound();
                lastPosition = position;
            }, delay);
        }
    }
    
    // Play the sound
    function playSound() {
        tickSound.currentTime = 0;
        tickSound.play().catch(e => console.log("Audio play failed:", e));
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
    
    // Create placeholder for WAV file
    fetch('sounds/tick.wav')
        .catch(() => {
            console.log('Warning: tick.wav not found. Please add a sound file.');
        });
    
    // Initialize on load
    init();
});