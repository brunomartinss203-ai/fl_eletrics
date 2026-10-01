/**
 * FL Electrics — interações compartilhadas.
 * O conteúdo de cada página está no respectivo arquivo .html.
 * Este arquivo controla apenas comportamento: menu, carrossel, filtros e formulários.
 */

const WHATSAPP = 'https://wa.me/5514998346979';

function initializeCarousel(root) {
    const slides = [...root.querySelectorAll('.slide')];
    const buttons = [...root.querySelectorAll('[data-slide]')];
    const pauseButton = root.querySelector('#pause-slider');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let current = 0;
    let wanted = 0;
    let running = false;
    let stopped = reduced;
    let timer = null;
    const ready = new Map();

    // Carrega e decodifica cada foto antes de exibir o próximo slide.
    const loadImage = (index) => {
        if (ready.has(index)) return ready.get(index);
        const image = slides[index].querySelector('.hero-image');
        const promise = (async () => {
            image.loading = 'eager';
            image.decoding = 'async';
            if (!image.complete) {
                await new Promise((resolve, reject) => {
                    const loaded = () => { cleanup(); resolve(); };
                    const failed = () => { cleanup(); reject(new Error('Imagem indisponível')); };
                    const cleanup = () => {
                        image.removeEventListener('load', loaded);
                        image.removeEventListener('error', failed);
                    };
                    image.addEventListener('load', loaded, { once: true });
                    image.addEventListener('error', failed, { once: true });
                });
            }
            if (!image.naturalWidth) throw new Error('Imagem indisponível');
            if (image.decode) await image.decode();
            image.classList.add('image-ready');
        })();
        ready.set(index, promise);
        return promise;
    };

    const select = (index) => {
        slides.forEach((slide, position) => {
            const active = position === index;
            slide.setAttribute('aria-hidden', String(!active));
            slide.inert = !active;
            slide.querySelectorAll('a').forEach((a) => { a.tabIndex = active ? 0 : -1; });
        });
        buttons.forEach((button, position) => {
            button.classList.toggle('selected', position === index);
            button.setAttribute('aria-pressed', String(position === index));
        });
    };

    const schedule = () => {
        clearTimeout(timer);
        if (stopped) return;
        timer = setTimeout(() => {
            if (!root.isConnected) return;
            if (document.hidden || document.querySelector('dialog[open]')) {
                schedule();
                return;
            }
            request((current + 1) % slides.length);
        }, 7000);
    };

    const process = async () => {
        if (running || !root.isConnected) return;
        running = true;
        try {
            while (wanted !== current && root.isConnected) {
                const next = wanted;
                try {
                    await loadImage(next);
                } catch {
                    if (wanted === next) { wanted = current; break; }
                    continue;
                }
                if (next !== wanted || !root.isConnected) continue;
                const previous = slides[current];
                const incoming = slides[next];
                incoming.classList.add('incoming');
                const animation = incoming.animate(
                    [{ opacity: 0 }, { opacity: 1 }],
                    { duration: reduced ? 0 : 700, easing: 'cubic-bezier(.22,.61,.36,1)', fill: 'forwards' }
                );
                await animation.finished.catch(() => {});
                previous.classList.remove('active');
                incoming.classList.add('active');
                incoming.classList.remove('incoming');
                animation.cancel();
                current = next;
                select(current);
            }
        } finally {
            running = false;
            root.removeAttribute('aria-busy');
            schedule();
        }
    };

    function request(index) {
        wanted = index;
        clearTimeout(timer);
        if (wanted === current && !running) { schedule(); return; }
        root.setAttribute('aria-busy', 'true');
        process();
    }

    slides.forEach((slide, index) => {
        slide.classList.toggle('active', index === 0);
        slide.classList.remove('incoming');
        loadImage(index).catch(() => {});
    });
    select(0);
    buttons.forEach((button, index) => { button.onclick = () => request(index); });

    const updatePause = () => {
        pauseButton.textContent = stopped ? 'Retomar' : 'Pausar';
        pauseButton.setAttribute('aria-label', stopped ? 'Retomar apresentação' : 'Pausar apresentação');
        pauseButton.setAttribute('aria-pressed', String(stopped));
    };
    pauseButton.onclick = () => {
        stopped = !stopped;
        updatePause();
        schedule();
    };
    updatePause();
    schedule();
}

function closeDialog(dialog) {
    if (dialog?.open) dialog.close();
    document.body.classList.remove('locked');
}

function setupMenu() {
    const menu = document.querySelector('#full-menu');
    const toggle = document.querySelector('.menu-toggle');
    const close = document.querySelector('.menu-close');
    if (!menu || !toggle || !close) return;

    toggle.addEventListener('click', () => {
        menu.showModal();
        document.body.classList.add('locked');
        toggle.setAttribute('aria-expanded', 'true');
    });
    close.addEventListener('click', () => closeDialog(menu));
    menu.addEventListener('close', () => {
        document.body.classList.remove('locked');
        toggle.setAttribute('aria-expanded', 'false');
    });
}

function setupWelcome() {
    const welcome = document.querySelector('#welcome');
    if (!welcome) return;
    document.querySelector('.welcome-close')?.addEventListener('click', () => closeDialog(welcome));
    welcome.addEventListener('close', () => document.body.classList.remove('locked'));
    let seen = false;
    try {
        seen = Boolean(sessionStorage.getItem('fl-welcome'));
        sessionStorage.setItem('fl-welcome', '1');
    } catch { /* Sessão bloqueada pelo navegador: continua normalmente. */ }
    if (!seen) {
        welcome.showModal();
        document.body.classList.add('locked');
    }
}

function setupDialogs() {
    document.querySelectorAll('dialog').forEach((dialog) => {
        dialog.addEventListener('click', (event) => {
            if (event.target !== dialog || dialog.id === 'full-menu') return;
            const rectangle = dialog.getBoundingClientRect();
            const outside = event.clientX < rectangle.left || event.clientX > rectangle.right ||
                            event.clientY < rectangle.top || event.clientY > rectangle.bottom;
            if (outside) closeDialog(dialog);
        });
    });

    const photo = document.querySelector('#photo-dialog');
    if (!photo) return;
    document.querySelector('.zoom-photo')?.addEventListener('click', () => {
        photo.showModal();
        document.body.classList.add('locked');
    });
    document.querySelector('.photo-close')?.addEventListener('click', () => closeDialog(photo));
    photo.addEventListener('close', () => document.body.classList.remove('locked'));
}

function setupCatalog() {
    const cards = document.querySelectorAll('.product-card');
    if (!cards.length) return;

    let filter = 'all';
    const search = document.querySelector('#model-search');
    const apply = () => {
        let count = 0;
        cards.forEach((card) => {
            const categoryMatches = filter === 'all' || card.dataset.kind === filter;
            const nameMatches = !search || card.textContent.toLowerCase().includes(search.value.toLowerCase());
            card.hidden = !(categoryMatches && nameMatches);
            if (!card.hidden) count += 1;
        });
        const empty = document.querySelector('#empty-results');
        if (empty) empty.hidden = count > 0;
    };

    document.querySelectorAll('[data-filter]').forEach((button) => {
        button.addEventListener('click', () => {
            filter = button.dataset.filter;
            document.querySelectorAll('[data-filter]').forEach((other) => {
                const active = other === button;
                other.classList.toggle('active', active);
                other.setAttribute('aria-pressed', String(active));
            });
            apply();
        });
    });
    search?.addEventListener('input', apply);
}

function setupContactForm() {
    const form = document.querySelector('#contact-form');
    if (!form) return;
    form.addEventListener('submit', (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const data = new FormData(form);
        const message = `Olá, FL Electrics!\nNome: ${data.get('nome')}\n` +
            `Telefone: ${data.get('telefone') || 'Não informado'}\n` +
            `Assunto: ${data.get('assunto')}\n\n${data.get('mensagem')}`;
        window.open(`${WHATSAPP}?text=${encodeURIComponent(message)}`, '_blank', 'noopener');
    });
}

function initializeSite() {
    document.querySelector('main')?.classList.add('page-enter');

    // Links para orçamentos recebem automaticamente a mensagem pré-definida.
    document.querySelectorAll('[data-message]').forEach((link) => {
        link.href = `${WHATSAPP}?text=${encodeURIComponent(link.dataset.message)}`;
    });

    // Indica a página ativa no menu de navegação.
    const page = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.site-header nav a').forEach((link) => {
        if (link.getAttribute('href') === page) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
    });

    setupMenu();
    setupWelcome();
    setupDialogs();
    setupCatalog();
    setupContactForm();

    const carousel = document.querySelector('.hero-slider');
    if (carousel) initializeCarousel(carousel);
}

document.addEventListener('DOMContentLoaded', initializeSite);
