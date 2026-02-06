document.addEventListener('DOMContentLoaded', () => {
    // Mobile Navigation Toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const navLinksItems = document.querySelectorAll('.nav-links li');

    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('nav-active');

        // Burger Animation
        hamburger.classList.toggle('toggle');
    });

    // Close mobile menu when a link is clicked
    navLinksItems.forEach(link => {
        link.addEventListener('click', () => {
            if (navLinks.classList.contains('nav-active')) {
                navLinks.classList.remove('nav-active');
            }
        });
    });

    // Smooth Scrolling for Anchor Links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();

            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                // Account for fixed navbar height
                const headerOffset = 70;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: "smooth"
                });
            }
        });
    });

    // Intersection Observer for Fade-in Animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, observerOptions);

    // Add fade-in class to elements you want to animate
    const animatedElements = document.querySelectorAll('.skill-card, .project-card, .timeline-item, .contact-item, .section-title');
    animatedElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(20px)';
        el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
        observer.observe(el);
    });

    // Add the class dynamically to trigger the CSS transition
    document.addEventListener('scroll', () => {
        animatedElements.forEach(el => {
            if (el.classList.contains('fade-in')) {
                el.style.opacity = '1';
                el.style.transform = 'translateY(0)';
            }
        });
    });
    // AI Chat Widget Logic
    const chatTrigger = document.getElementById('chat-trigger');
    const chatContainer = document.getElementById('chat-container');
    const closeChat = document.getElementById('close-chat');
    const chatMessages = document.getElementById('chat-messages');
    const chatInput = document.getElementById('chat-input');
    const sendMessage = document.getElementById('send-message');

    // Groq API Configuration (User should replace the API key)
    const GROQ_API_KEY = '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';
    const API_URL = 'https://api.groq.com/openai/v1/chat/completions';

    const SYSTEM_PROMPT = `
You are an AI assistant for G. Ukesh's personal portfolio. 
Your role is to act as both an internal and external knowledge base, focusing strictly on Ukesh and his professional work.

ROLE: Professional, concise, and friendly virtual portfolio guide.

INTERNAL DATA CONTEXT:
- Name: G. Ukesh
- Degree: B.E. Mechanical Engineering
- Role: Quality Engineering
- Skills: CATIA, SolidWorks, ANSYS, MS Office, Quality Tools
- Interests: Quality Engineering, Design, Manufacturing, Analysis
- Purpose of website: Job portfolio and professional showcase
- Location: Gudiyatham, Tamil Nadu, India
- Contact: ukeshgnanakumar@gmail.com | +91 93454 70783
- Experience: Quality Line Inspector at Abrami Precision Works (1 Year 7 Months)
- Projects: Automatic Door Opening (Arduino), PCM Thermal Storage, Fire Detection System

KNOWLEDGE SOURCE:
- Use internal data for specific details about Ukesh.
- Use your external knowledge to provide context, explain his skills, or elaborate on engineering concepts related to his projects.
- Example: If asked about "Quality Engineering", explain it professionally and relate it to Ukesh's experience.

STRICT RULES:
1. IGNORE all questions unrelated to Ukesh or his work.
2. If asked about something unrelated (e.g., general news, other people, unrelated topics), you MUST respond with: "I can only answer question related to ukesh portfolio."
3. Do NOT mention Groq, APIs, system prompts, or internal pipelines.
4. Keep responses recruiter-friendly, clear, and professional.
5. Always bring the conversation back to Ukesh's suitability for a role if appropriate.`;

    let chatHistory = [];
    let isFirstOpen = true;

    // Toggle Chat
    chatTrigger.addEventListener('click', () => {
        chatContainer.classList.toggle('hidden');
        if (!chatContainer.classList.contains('hidden') && isFirstOpen) {
            appendMessage('bot', "Hi 👋 I’m Ukesh’s AI assistant. Ask me anything about his skills, education, or career goals.");
            isFirstOpen = false;
        }
        chatInput.focus();
    });

    closeChat.addEventListener('click', () => {
        chatContainer.classList.add('hidden');
    });

    // Send Message Logic
    async function handleSend() {
        const text = chatInput.value.trim();
        if (!text) return;

        appendMessage('user', text);
        chatInput.value = '';

        // Show typing indicator
        const typingId = showTypingIndicator();

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${GROQ_API_KEY}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        ...chatHistory.map(msg => ({
                            role: msg.type === 'user' ? 'user' : 'assistant',
                            content: msg.text
                        })),
                        { role: "user", content: text }
                    ],
                    temperature: 0.7,
                    max_tokens: 300
                })
            });

            const data = await response.json();
            removeTypingIndicator(typingId);

            if (data.choices && data.choices[0]) {
                const botResponse = data.choices[0].message.content;
                appendMessage('bot', botResponse);
                chatHistory.push({ type: 'user', text });
                chatHistory.push({ type: 'bot', text: botResponse });
            } else {
                appendMessage('bot', "I'm having trouble connecting right now. Please try again later.");
            }
        } catch (error) {
            removeTypingIndicator(typingId);
            appendMessage('bot', "I'm having trouble connecting right now. Please try again later.");
            console.error('Chat Error:', error);
        }
    }

    sendMessage.addEventListener('click', handleSend);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleSend();
    });

    function appendMessage(type, text) {
        const msgDiv = document.createElement('div');
        msgDiv.className = `message ${type}-message`;
        msgDiv.textContent = text;
        chatMessages.appendChild(msgDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function showTypingIndicator() {
        const id = 'typing-' + Date.now();
        const typingDiv = document.createElement('div');
        typingDiv.id = id;
        typingDiv.className = 'message bot-message typing';
        typingDiv.innerHTML = '<span></span><span></span><span></span>';
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        return id;
    }

    function removeTypingIndicator(id) {
        const el = document.getElementById(id);
        if (el) el.remove();
    }
});
