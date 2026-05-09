
function initMenu(menuData) {
    const menuContent = document.getElementById('menuContent');
    if (!menuContent) return;
    const items = menuData.split('|');
    menuContent.innerHTML = ''; 
    items.forEach(item => {
        const parts = item.split(',');
        if (parts.length >= 3) {
            const [text, link, icon] = parts;
            const a = document.createElement('a');
            a.href = link;
            a.className = 'menu-item';
            a.innerHTML = `<span class="icon">${icon}</span> <span class="text">${text}</span>`;
            menuContent.appendChild(a);
        }
    });
}
