
import { useEffect, useMemo, useState } from "react";
import "./App.css";

const INITIAL_POSTS = [
  {
    id: 1,
    title: "Как начать свой путь в IT",
    excerpt: "Несколько принципов, которые помогут начать программировать и не потерять мотивацию.",
    content:
      "Начни с основ HTML, CSS и JavaScript. Создавай небольшие проекты, разбирай ошибки и постепенно переходи к React. Главное — регулярная практика, а не количество просмотренных уроков.",
    category: "IT",
    tags: ["React", "Обучение"],
    author: "AKI",
    date: new Date().toISOString(),
    likes: 12,
    views: 86,
    favorite: true,
    status: "published",
  },
  {
    id: 2,
    title: "Дисциплина важнее мотивации",
    excerpt: "Почему маленькие действия каждый день могут привести к большим результатам.",
    content:
      "Мотивация меняется, а привычки помогают продолжать. Ставь реалистичные цели, дели большие задачи на небольшие шаги и отмечай прогресс. Не стремись к идеальному результату с первого раза.",
    category: "Развитие",
    tags: ["Привычки", "Цели"],
    author: "AKI",
    date: new Date(Date.now() - 86400000).toISOString(),
    likes: 8,
    views: 54,
    favorite: false,
    status: "published",
  },
  {
    id: 3,
    title: "Мой следующий проект",
    excerpt: "Идея приложения, над которым я хочу поработать.",
    content: "Здесь можно сохранить идею и вернуться к ней позже.",
    category: "Идеи",
    tags: ["Проект"],
    author: "AKI",
    date: new Date().toISOString(),
    likes: 0,
    views: 0,
    favorite: false,
    status: "draft",
  },
];

const CATEGORIES = ["Все", "IT", "Развитие", "Идеи", "Учёба", "Дизайн", "Другое"];

function loadPosts() {
  try {
    const saved = localStorage.getItem("nexus-blog-posts");
    return saved ? JSON.parse(saved) : INITIAL_POSTS;
  } catch {
    return INITIAL_POSTS;
  }
}

function formatDate(date) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(date));
}

const EMPTY_FORM = {
  title: "",
  excerpt: "",
  content: "",
  category: "IT",
  tags: "",
  status: "published",
};

export default function App() {
  const [posts, setPosts] = useState(loadPosts);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Все");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState("home");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [activePost, setActivePost] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [toast, setToast] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [profileName, setProfileName] = useState(
    () => localStorage.getItem("nexus-blog-name") || "AKI"
  );
  const [profileInput, setProfileInput] = useState(profileName);

  useEffect(() => {
    localStorage.setItem("nexus-blog-posts", JSON.stringify(posts));
  }, [posts]);

  useEffect(() => {
    localStorage.setItem("nexus-blog-name", profileName);
  }, [profileName]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  const published = posts.filter((post) => post.status === "published");
  const drafts = posts.filter((post) => post.status === "draft");
  const favorites = published.filter((post) => post.favorite);

  const visiblePosts = useMemo(() => {
    let result = [...published];

    if (page === "favorites") result = result.filter((post) => post.favorite);
    if (page === "drafts") return drafts;
    if (category !== "Все" && page === "home") {
      result = result.filter((post) => post.category === category);
    }

    const query = search.trim().toLowerCase();
    if (query) {
      result = result.filter((post) =>
        [
          post.title,
          post.excerpt,
          post.content,
          post.category,
          ...(post.tags || []),
          post.author,
        ]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );
    }

    if (sort === "newest") {
      result.sort((a, b) => new Date(b.date) - new Date(a.date));
    } else if (sort === "oldest") {
      result.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sort === "likes") {
      result.sort((a, b) => b.likes - a.likes);
    } else if (sort === "views") {
      result.sort((a, b) => b.views - a.views);
    }

    return result;
  }, [posts, page, category, search, sort]);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModal(true);
  }

  function openEdit(post) {
    setEditing(post.id);
    setForm({
      title: post.title,
      excerpt: post.excerpt,
      content: post.content,
      category: post.category,
      tags: (post.tags || []).join(", "),
      status: post.status,
    });
    setActivePost(null);
    setModal(true);
  }

  function savePost(event) {
    event.preventDefault();

    const title = form.title.trim();
    if (!title) {
      setToast("Введите название публикации");
      return;
    }

    const tags = form.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 8);

    if (editing !== null) {
      setPosts((current) =>
        current.map((post) =>
          post.id === editing
            ? {
                ...post,
                ...form,
                title,
                tags,
                excerpt: form.excerpt.trim(),
                content: form.content.trim(),
              }
            : post
        )
      );
      setToast("Публикация обновлена");
    } else {
      const newPost = {
        id: Date.now(),
        ...form,
        title,
        excerpt: form.excerpt.trim(),
        content: form.content.trim(),
        tags,
        author: profileName,
        date: new Date().toISOString(),
        likes: 0,
        views: 0,
        favorite: false,
      };

      setPosts((current) => [newPost, ...current]);
      setToast(form.status === "draft" ? "Черновик сохранён" : "Публикация создана");
    }

    setModal(false);
    setForm(EMPTY_FORM);
    setEditing(null);
  }

  function deletePost(id) {
    setPosts((current) => current.filter((post) => post.id !== id));
    setConfirmDelete(null);
    setActivePost(null);
    setToast("Публикация удалена");
  }

  function toggleFavorite(id) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, favorite: !post.favorite } : post
      )
    );
  }

  function likePost(id) {
    setPosts((current) =>
      current.map((post) =>
        post.id === id ? { ...post, likes: post.likes + 1 } : post
      )
    );
  }

  function openDetails(post) {
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id ? { ...item, views: item.views + 1 } : item
      )
    );
    setActivePost({ ...post, views: post.views + 1 });
  }

  function resetFilters() {
    setSearch("");
    setCategory("Все");
    setSort("newest");
  }

  const pageTitles = {
    home: "Исследуй идеи",
    favorites: "Избранное",
    drafts: "Черновики",
    stats: "Статистика",
    settings: "Настройки",
  };

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <aside className="sidebar glass">
        <a className="brand" href="#home" onClick={() => setPage("home")}>
          <span className="brand-mark">N</span>
          <span>
            <strong>NEXUS</strong>
            <small>PERSONAL BLOG</small>
          </span>
        </a>

        <button className="create-button" onClick={openCreate}>
          <span>＋</span> Новая публикация
        </button>

        <div className="nav-label">РАБОЧЕЕ ПРОСТРАНСТВО</div>
        <nav className="navigation">
          <button className={page === "home" ? "nav-item active" : "nav-item"} onClick={() => setPage("home")}>
            <span>⌂</span> Главная
          </button>
          <button className={page === "favorites" ? "nav-item active" : "nav-item"} onClick={() => setPage("favorites")}>
            <span>♡</span> Избранное <span className="nav-count">{favorites.length}</span>
          </button>
          <button className={page === "drafts" ? "nav-item active" : "nav-item"} onClick={() => setPage("drafts")}>
            <span>▤</span> Черновики <span className="nav-count">{drafts.length}</span>
          </button>
          <button className={page === "stats" ? "nav-item active" : "nav-item"} onClick={() => setPage("stats")}>
            <span>▥</span> Статистика
          </button>
        </nav>

        <div className="nav-label category-label">ТВОИ КАТЕГОРИИ</div>
        <div className="category-list">
          {CATEGORIES.filter((item) => item !== "Все").map((item) => (
            <button
              key={item}
              className={category === item && page === "home" ? "category-item selected" : "category-item"}
              onClick={() => {
                setPage("home");
                setCategory(category === item ? "Все" : item);
              }}
            >
              <span className={`category-dot dot-${item}`} />
              {item}
            </button>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="sidebar-tip">
            <span className="tip-icon">✦</span>
            <strong>Твоя идея имеет значение</strong>
            <p>Записывай мысли. Развивай их. Публикуй.</p>
          </div>
          <button className="nav-item settings-link" onClick={() => {
            setProfileInput(profileName);
            setPage("settings");
          }}>
            <span>⚙</span> Настройки
          </button>
          <div className="profile-row">
            <div className="avatar">{profileName.charAt(0).toUpperCase() || "A"}</div>
            <div className="profile-info">
              <strong>{profileName}</strong>
              <small>Автор блога</small>
            </div>
            <span className="online-dot" />
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">NEXUS <span>/</span> {pageTitles[page]}</div>
          <div className="topbar-actions">
            <span className="live-indicator"><i /> Все изменения сохранены</span>
            <button className="icon-button" title="Создать публикацию" onClick={openCreate}>＋</button>
            <button className="avatar small-avatar" onClick={() => setPage("settings")}>
              {profileName.charAt(0).toUpperCase() || "A"}
            </button>
          </div>
        </header>

        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span /> ТВОЁ ЦИФРОВОЕ ПРОСТРАНСТВО</div>
            <h1>{page === "home" ? <>Мысли становятся<br /><span>чем-то большим.</span></> : pageTitles[page]}</h1>
            <p>
              {page === "home"
                ? "Сохраняй идеи, делись знаниями и создавай собственную коллекцию историй."
                : page === "favorites"
                ? "Все публикации, которые ты отметил как важные."
                : page === "drafts"
                ? "Идеи, которые можно продолжить в любое время."
                : page === "stats"
                ? "Посмотри, как развивается твой блог."
                : "Настрой своё пространство для публикаций."}
            </p>
            {page === "home" && (
              <button className="primary-button" onClick={openCreate}>Создать публикацию <span>↗</span></button>
            )}
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-glass-card">
              <div className="art-top"><span>✦</span><span>IDEA SPACE</span></div>
              <div className="art-lines"><i /><i /><i /></div>
              <div className="art-bottom"><span>✧</span><b>CREATE SOMETHING</b></div>
            </div>
            <div className="floating-chip chip-one">✦ Твоя идея</div>
            <div className="floating-chip chip-two">∞ Возможности</div>
          </div>
        </section>

        <section className="stats-strip">
          <div className="mini-stat">
            <span className="stat-icon purple-icon">▤</span>
            <div><small>ПУБЛИКАЦИИ</small><strong>{published.length}</strong></div>
          </div>
          <div className="mini-stat">
            <span className="stat-icon pink-icon">♡</span>
            <div><small>ЛАЙКИ</small><strong>{published.reduce((sum, post) => sum + post.likes, 0)}</strong></div>
          </div>
          <div className="mini-stat">
            <span className="stat-icon blue-icon">◉</span>
            <div><small>ПРОСМОТРЫ</small><strong>{published.reduce((sum, post) => sum + post.views, 0)}</strong></div>
          </div>
          <div className="mini-stat">
            <span className="stat-icon gold-icon">✧</span>
            <div><small>ИЗБРАННОЕ</small><strong>{favorites.length}</strong></div>
          </div>
        </section>

        {page === "stats" ? (
          <section className="glass stats-panel">
            <div className="section-heading">
              <div><div className="eyebrow">АНАЛИТИКА</div><h2>Обзор блога</h2></div>
            </div>
            <div className="analytics-grid">
              <div className="analytics-card"><span>Всего публикаций</span><strong>{posts.length}</strong><small>Включая черновики</small></div>
              <div className="analytics-card"><span>Опубликовано</span><strong>{published.length}</strong><small>Доступно читателям</small></div>
              <div className="analytics-card"><span>Черновики</span><strong>{drafts.length}</strong><small>Можно доработать</small></div>
              <div className="analytics-card"><span>Средние лайки</span><strong>{published.length ? Math.round(published.reduce((sum, post) => sum + post.likes, 0) / published.length) : 0}</strong><small>На публикацию</small></div>
            </div>
            <h3 className="chart-title">Популярные публикации</h3>
            {published.length ? [...published].sort((a, b) => b.views - a.views).slice(0, 5).map((post) => {
              const maxViews = Math.max(1, ...published.map((item) => item.views));
              return <div className="bar-row" key={post.id}><span>{post.title}</span><div className="bar-track"><div className="bar-fill" style={{ width: `${post.views / maxViews * 100}%` }} /></div><b>{post.views}</b></div>;
            }) : <p className="muted">Пока нет опубликованных записей.</p>}
          </section>
        ) : page === "settings" ? (
          <section className="glass settings-panel">
            <div className="eyebrow">ПРОФИЛЬ</div>
            <h2>Твоё пространство</h2>
            <p className="muted">Имя будет отображаться рядом с новыми публикациями.</p>
            <form onSubmit={(event) => {
              event.preventDefault();
              if (!profileInput.trim()) return;
              setProfileName(profileInput.trim());
              setToast("Профиль обновлён");
            }}>
              <label htmlFor="profileName">Имя автора</label>
              <input id="profileName" value={profileInput} onChange={(event) => setProfileInput(event.target.value)} maxLength={32} />
              <button className="primary-button" type="submit">Сохранить изменения <span>↗</span></button>
            </form>
            <div className="settings-note">Данные блога хранятся локально в браузере на этом устройстве.</div>
          </section>
        ) : (
          <>
            <section className="content-toolbar">
              <div className="section-heading">
                <div><div className="eyebrow">ТВОЯ БИБЛИОТЕКА</div><h2>{page === "home" ? "Последние публикации" : pageTitles[page]}</h2></div>
                <span className="result-count">{visiblePosts.length} записей</span>
              </div>
              <div className="filters">
                <div className="search-box">
                  <span>⌕</span>
                  <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Найти публикацию..." aria-label="Поиск публикаций" />
                  {search && <button onClick={() => setSearch("")} aria-label="Очистить поиск">×</button>}
                </div>
                <select value={sort} onChange={(event) => setSort(event.target.value)} aria-label="Сортировка">
                  <option value="newest">Сначала новые</option>
                  <option value="oldest">Сначала старые</option>
                  <option value="likes">По лайкам</option>
                  <option value="views">По просмотрам</option>
                </select>
              </div>
            </section>

            {page === "home" && (
              <div className="category-chips">
                {CATEGORIES.map((item) => (
                  <button key={item} className={category === item ? "chip active-chip" : "chip"} onClick={() => setCategory(item)}>{item}</button>
                ))}
              </div>
            )}

            {visiblePosts.length ? (
              <section className="post-grid">
                {visiblePosts.map((post, index) => (
                  <article className={`post-card glass card-${index % 3}`} key={post.id}>
                    <div className={`post-cover cover-${index % 4}`}>
                      <span className="cover-orb orb-a" />
                      <span className="cover-orb orb-b" />
                      <span className="cover-index">{String(index + 1).padStart(2, "0")}</span>
                      <span className="cover-category">{post.category}</span>
                      <button className={post.favorite ? "favorite-button is-favorite" : "favorite-button"} onClick={() => toggleFavorite(post.id)} title="Добавить в избранное">{post.favorite ? "♥" : "♡"}</button>
                      <div className="cover-symbol">{["✳", "◈", "✦", "◎"][index % 4]}</div>
                    </div>
                    <div className="post-body">
                      <div className="post-meta"><span>{post.author || profileName}</span><i />{formatDate(post.date)}{post.status === "draft" && <b className="draft-label">Черновик</b>}</div>
                      <h3>{post.title}</h3>
                      <p className="post-excerpt">{post.excerpt || "Открой публикацию, чтобы прочитать подробнее."}</p>
                      <div className="tag-list">{(post.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
                      <div className="post-footer">
                        <div className="engagement">
                          <button onClick={() => likePost(post.id)} title="Поставить лайк">♡ <span>{post.likes}</span></button>
                          <span>◉ {post.views}</span>
                        </div>
                        <div className="post-actions">
                          <button title="Читать публикацию" onClick={() => openDetails(post)}>Читать ↗</button>
                          <button className="more-button" title="Редактировать" onClick={() => openEdit(post)}>✎</button>
                          <button className="more-button delete-action" title="Удалить" onClick={() => setConfirmDelete(post.id)}>×</button>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </section>
            ) : (
              <div className="empty-state glass">
                <span>✧</span><h3>Здесь пока пусто</h3>
                <p>{search ? "Попробуй изменить поисковый запрос." : "Создай публикацию или выбери другую категорию."}</p>
                <button className="primary-button" onClick={() => { resetFilters(); if (page === "favorites") setPage("home"); else openCreate(); }}>Создать публикацию <span>↗</span></button>
              </div>
            )}
          </>
        )}

        <footer className="footer"><span>© 2026 NEXUS BY AKI</span><span>СОЗДАНО ДЛЯ ТВОИХ ИДЕЙ <b>✦</b></span></footer>
      </main>

      {modal && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setModal(false); }}>
          <form className="editor-modal glass" onSubmit={savePost}>
            <div className="modal-heading">
              <div><div className="eyebrow">{editing !== null ? "РЕДАКТИРОВАНИЕ" : "НОВАЯ ИДЕЯ"}</div><h2>{editing !== null ? "Измени публикацию" : "Создай публикацию"}</h2></div>
              <button type="button" className="close-button" onClick={() => setModal(false)}>×</button>
            </div>
            <label htmlFor="postTitle">Название *</label>
            <input id="postTitle" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Например, мои идеи на будущее" maxLength={100} required autoFocus />
            <label htmlFor="postExcerpt">Краткое описание</label>
            <textarea id="postExcerpt" rows="2" maxLength={180} value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} placeholder="О чём эта публикация?" />
            <label htmlFor="postContent">Содержание</label>
            <textarea id="postContent" rows="5" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Расскажи свою историю..." />
            <div className="form-two-columns">
              <div><label htmlFor="postCategory">Категория</label><select id="postCategory" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>{CATEGORIES.filter((item) => item !== "Все").map((item) => <option key={item}>{item}</option>)}</select></div>
              <div><label htmlFor="postStatus">Статус</label><select id="postStatus" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}><option value="published">Опубликовано</option><option value="draft">Черновик</option></select></div>
            </div>
            <label htmlFor="postTags">Теги <span className="label-hint">через запятую</span></label>
            <input id="postTags" value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="React, идеи, обучение" />
            <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => setModal(false)}>Отмена</button><button type="submit" className="primary-button">{editing !== null ? "Сохранить" : form.status === "draft" ? "Сохранить черновик" : "Опубликовать"} <span>↗</span></button></div>
          </form>
        </div>
      )}

      {activePost && (
        <div className="overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) setActivePost(null); }}>
          <article className="reader-modal glass">
            <button className="close-button reader-close" onClick={() => setActivePost(null)}>×</button>
            <div className="reader-cover"><span>{activePost.category}</span><div>✦</div></div>
            <div className="reader-content">
              <div className="post-meta">{activePost.author || profileName} <i /> {formatDate(activePost.date)}</div>
              <h2>{activePost.title}</h2>
              {activePost.excerpt && <p className="reader-excerpt">{activePost.excerpt}</p>}
              <div className="reader-text">{activePost.content || "У этой публикации пока нет текста."}</div>
              <div className="tag-list reader-tags">{(activePost.tags || []).map((tag) => <span key={tag}>#{tag}</span>)}</div>
              <div className="reader-actions"><button className="secondary-button" onClick={() => toggleFavorite(activePost.id)}>{activePost.favorite ? "♥ В избранном" : "♡ В избранное"}</button><button className="primary-button" onClick={() => likePost(activePost.id)}>♡ Нравится · {posts.find((post) => post.id === activePost.id)?.likes ?? activePost.likes}</button><button className="secondary-button" onClick={() => openEdit(activePost)}>✎ Изменить</button></div>
            </div>
          </article>
        </div>
      )}

      {confirmDelete !== null && (
        <div className="overlay">
          <div className="confirm-modal glass">
            <div className="confirm-icon">!</div><h3>Удалить публикацию?</h3><p>Это действие нельзя отменить.</p>
            <div className="modal-actions"><button className="secondary-button" onClick={() => setConfirmDelete(null)}>Отмена</button><button className="danger-button" onClick={() => deletePost(confirmDelete)}>Удалить</button></div>
          </div>
        </div>
      )}

      {toast && <div className="toast"><span>✓</span>{toast}</div>}
    </div>
  );
}
