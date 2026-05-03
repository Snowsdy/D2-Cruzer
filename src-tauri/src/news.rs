use serde::{Deserialize, Serialize};

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct NewsArticle {
    pub title: String,
    pub link: String,
    pub published: String,
    pub summary: String,
    pub content_html: String,
    pub image_url: Option<String>,
    pub source: String,
}

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Tweet {
    pub author: String,
    pub author_handle: String,
    pub author_avatar: Option<String>,
    pub content: String,
    pub published: String,
    pub link: String,
}

#[derive(Debug, Serialize)]
pub struct NewsError {
    pub message: String,
}

const BUNGIE_BASE: &str = "https://www.bungie.net/Platform";

#[derive(Debug, Deserialize)]
struct RssNewsResponse {
    #[serde(rename = "Response")]
    response: Option<RssNewsPayload>,
}

#[derive(Debug, Deserialize)]
struct RssNewsPayload {
    #[serde(rename = "NewsArticles", default)]
    news_articles: Vec<RssNewsEntry>,
}

#[derive(Debug, Deserialize)]
struct RssNewsEntry {
    #[serde(rename = "Title", default)]
    title: String,
    #[serde(rename = "Link", default)]
    link: String,
    #[serde(rename = "PubDate", default)]
    pub_date: String,
    #[serde(rename = "UniqueIdentifier", default)]
    #[allow(dead_code)]
    unique_identifier: String,
    #[serde(rename = "Description", default)]
    description: String,
    #[serde(rename = "ImagePath", default)]
    image_path: String,
    #[serde(rename = "OptionalMobileImagePath", default)]
    #[allow(dead_code)]
    optional_mobile_image_path: String,
}

fn strip_html_to_text(s: &str) -> String {
    let cleaned = clean_article_html(s);
    let mut out = String::with_capacity(cleaned.len());
    let mut in_tag = false;
    for c in cleaned.chars() {
        match c {
            '<' => in_tag = true,
            '>' => in_tag = false,
            _ if !in_tag => out.push(c),
            _ => {}
        }
    }
    out.split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Strip Contentstack template placeholder markers that sometimes leak into
/// the rendered HTML as plain text (they're meant to be resolved server-side
/// but Bungie's search endpoint occasionally returns them unresolved).
/// Real-world patterns include `[[data-content-id='...' data-template-type='Inline' ]`,
/// `[/data-...]`, `[]`, `[ ]`, and assorted residue.
fn clean_article_html(s: &str) -> String {
    let mut out = String::with_capacity(s.len());
    let mut rest = s;
    while !rest.is_empty() {
        // Template markers may start with one OR two opening brackets.
        let body_after_open = if rest.starts_with("[[") {
            Some(&rest[2..])
        } else if rest.starts_with('[') {
            Some(&rest[1..])
        } else {
            None
        };

        if let Some(after) = body_after_open {
            let tl = after.trim_start();
            if tl.starts_with("data-")
                || tl.starts_with("/data-")
                || after.starts_with("]")
                || tl.is_empty()
            {
                // Skip up to first closing bracket (optionally a second one).
                if let Some(close) = rest.find(']') {
                    let mut next = close + 1;
                    if rest.as_bytes().get(next) == Some(&b']') {
                        next += 1;
                    }
                    rest = &rest[next..];
                    continue;
                }
            }
        }

        let ch = rest.chars().next().unwrap();
        out.push(ch);
        rest = &rest[ch.len_utf8()..];
    }
    // Second pass: remove paragraphs / divs that became whitespace-only.
    remove_empty_blocks(&out)
}

fn remove_empty_blocks(html: &str) -> String {
    // Naive pass: strip `<p>...</p>` and `<div>...</div>` where inner is
    // whitespace only. Repeated until stable to handle nested empties.
    let mut prev = html.to_string();
    loop {
        let next = strip_empty_once(&prev);
        if next == prev {
            return next;
        }
        prev = next;
    }
}

fn strip_empty_once(html: &str) -> String {
    let tags = ["p", "div", "span"];
    let mut out = html.to_string();
    for tag in tags {
        let open = format!("<{}>", tag);
        let open_alt = format!("<{} ", tag);
        let close = format!("</{}>", tag);
        let mut start = 0;
        while let Some(idx) = find_open(&out[start..], &open, &open_alt) {
            let abs = start + idx;
            // find matching close
            let after_open = match out[abs..].find('>') {
                Some(p) => abs + p + 1,
                None => break,
            };
            let rel_close = match out[after_open..].find(&close) {
                Some(p) => p,
                None => {
                    start = abs + 1;
                    continue;
                }
            };
            let inner = &out[after_open..after_open + rel_close];
            if inner.trim().is_empty() {
                let end = after_open + rel_close + close.len();
                out.replace_range(abs..end, "");
                // restart scan from the same position
                continue;
            }
            start = abs + 1;
        }
    }
    out
}

fn find_open(haystack: &str, open: &str, open_alt: &str) -> Option<usize> {
    let a = haystack.find(open);
    let b = haystack.find(open_alt);
    match (a, b) {
        (Some(x), Some(y)) => Some(x.min(y)),
        (Some(x), None) => Some(x),
        (None, Some(y)) => Some(y),
        (None, None) => None,
    }
}

/// Scan `html` for the first `<img src="..."/>` and return the absolutized
/// URL, if any. Used as a fallback when the RSS feed doesn't populate the
/// dedicated `ImagePath` field but embeds the article hero inside the
/// description markup (common on Bungie's newer press-kit feeds).
fn first_img_src_in_html(html: &str) -> Option<String> {
    let mut rest = html;
    while let Some(idx) = rest.find("<img") {
        let tag_start = idx;
        let after = &rest[tag_start..];
        let Some(tag_end) = after.find('>') else {
            return None;
        };
        let tag = &after[..=tag_end];
        // Try double then single quotes.
        for (open, close) in [("src=\"", "\""), ("src='", "'")] {
            if let Some(a) = tag.find(open) {
                let b_start = a + open.len();
                if let Some(b) = tag[b_start..].find(close) {
                    let url = &tag[b_start..b_start + b];
                    if !url.is_empty() {
                        return Some(absolutize_image_url(url));
                    }
                }
            }
        }
        rest = &after[tag_end..];
    }
    None
}

fn absolutize_image_url(url: &str) -> String {
    if url.is_empty() {
        return String::new();
    }
    if url.starts_with("http") {
        return url.to_string();
    }
    if url.starts_with("//") {
        return format!("https:{}", url);
    }
    if url.starts_with('/') {
        return format!("https://www.bungie.net{}", url);
    }
    format!("https://www.bungie.net/{}", url)
}

/// Walk the article body HTML and rewrite every `<img src="..."/>` so
/// that relative URLs (e.g. `/pubassets/pkgs/...png` or bare filenames
/// from press-kit posts) become absolute Bungie CDN URLs. Without this
/// pass, images embedded inside article bodies render as broken-image
/// placeholders showing the file name as alt text.
///
/// Handles double-quoted, single-quoted, and `srcset="..."` attributes.
fn rewrite_img_srcs(html: &str) -> String {
    let mut out = String::with_capacity(html.len());
    let mut rest = html;
    while let Some(rel) = rest.find("<img") {
        out.push_str(&rest[..rel]);
        let remainder = &rest[rel..];
        let Some(tag_len) = remainder.find('>') else {
            // Unclosed tag at EOF — emit remainder untouched.
            out.push_str(remainder);
            return out;
        };
        let tag = &remainder[..=tag_len];
        out.push_str(&rewrite_img_tag(tag));
        rest = &remainder[tag_len + 1..];
    }
    out.push_str(rest);
    out
}

fn rewrite_img_tag(tag: &str) -> String {
    // Bungie's CMS lazy-loads images: the `src` attribute often holds a
    // tiny data-URL placeholder, and the real URL lives in `data-src`
    // (or `data-original` / `data-lazy-src`). Client-side JS swaps them
    // at runtime — but we scrape the raw HTML statically, so we promote
    // the data-* URL to `src` ourselves when present.
    let promoted = promote_lazy_src(tag);
    let mut out = promoted;
    // Rewrite `src="..."` / `src='...'`.
    out = rewrite_attr(&out, "src=\"", '"');
    out = rewrite_attr(&out, "src='", '\'');
    // Rewrite `srcset="..."` — entries are comma-separated `url descriptor`.
    out = rewrite_srcset(&out, "srcset=\"", '"');
    out = rewrite_srcset(&out, "srcset='", '\'');
    out
}

/// Read any `data-src` / `data-original` / `data-lazy-src` value from the
/// tag and copy it into `src=`, overriding any placeholder there. Returns
/// the original string unchanged if no such attribute is found or the
/// existing `src` already looks like a real (http/https/relative path)
/// URL rather than a base64 placeholder.
fn promote_lazy_src(tag: &str) -> String {
    let candidates = ["data-src=", "data-original=", "data-lazy-src="];
    for needle in candidates {
        for quote in ['"', '\''] {
            let full_needle = format!("{needle}{quote}");
            if let Some(start) = tag.find(&full_needle) {
                let value_start = start + full_needle.len();
                if let Some(end) = tag[value_start..].find(quote) {
                    let url = &tag[value_start..value_start + end];
                    if url.is_empty() {
                        continue;
                    }
                    // Replace or add `src="url"` — simplest way: strip any
                    // existing `src` attribute and re-append at the end.
                    let stripped = strip_attr(tag, "src=\"", '"');
                    let stripped = strip_attr(&stripped, "src='", '\'');
                    // Insert `src="URL"` before the closing `>`.
                    let Some(close) = stripped.rfind('>') else {
                        return stripped;
                    };
                    let mut rebuilt = String::with_capacity(stripped.len() + url.len() + 8);
                    rebuilt.push_str(&stripped[..close]);
                    rebuilt.push_str(" src=\"");
                    rebuilt.push_str(url);
                    rebuilt.push('"');
                    rebuilt.push_str(&stripped[close..]);
                    return rebuilt;
                }
            }
        }
    }
    tag.to_string()
}

/// Remove a single attribute (including value) from a tag, non-recursively.
fn strip_attr(tag: &str, needle: &str, quote: char) -> String {
    let Some(i) = tag.find(needle) else {
        return tag.to_string();
    };
    let value_start = i + needle.len();
    let Some(rel) = tag[value_start..].find(quote) else {
        return tag.to_string();
    };
    let value_end = value_start + rel + 1; // include closing quote
                                           // Trim one leading space if present so we don't leave "  ".
    let before_end = if i > 0 && tag.as_bytes()[i - 1] == b' ' {
        i - 1
    } else {
        i
    };
    format!("{}{}", &tag[..before_end], &tag[value_end..])
}

fn rewrite_attr(haystack: &str, needle: &str, quote: char) -> String {
    let Some(i) = haystack.find(needle) else {
        return haystack.to_string();
    };
    let value_start = i + needle.len();
    let Some(rel) = haystack[value_start..].find(quote) else {
        return haystack.to_string();
    };
    let value_end = value_start + rel;
    let url = &haystack[value_start..value_end];
    let rewritten = absolutize_image_url(url);
    format!(
        "{}{}{}",
        &haystack[..value_start],
        rewritten,
        &haystack[value_end..]
    )
}

fn rewrite_srcset(haystack: &str, needle: &str, quote: char) -> String {
    let Some(i) = haystack.find(needle) else {
        return haystack.to_string();
    };
    let value_start = i + needle.len();
    let Some(rel) = haystack[value_start..].find(quote) else {
        return haystack.to_string();
    };
    let value_end = value_start + rel;
    let value = &haystack[value_start..value_end];
    let rewritten = value
        .split(',')
        .map(|entry| {
            let entry = entry.trim();
            // Each entry is `url [descriptor]`. Split on first whitespace.
            match entry.find(|c: char| c.is_whitespace()) {
                Some(sep) => {
                    let url = &entry[..sep];
                    let descriptor = &entry[sep..];
                    format!("{}{}", absolutize_image_url(url), descriptor)
                }
                None => absolutize_image_url(entry),
            }
        })
        .collect::<Vec<_>>()
        .join(", ");
    format!(
        "{}{}{}",
        &haystack[..value_start],
        rewritten,
        &haystack[value_end..]
    )
}

fn classify(tags: &[String], title: &str, content: &str) -> String {
    let lc = format!("{} {} {}", tags.join(" "), title, content).to_lowercase();
    if lc.contains("marathon") {
        "marathon".into()
    } else if lc.contains("destiny") {
        "destiny".into()
    } else {
        "bungie".into()
    }
}

async fn bungie_client() -> Result<reqwest::Client, NewsError> {
    reqwest::Client::builder()
        .user_agent("CruzerCompagnon/0.1.0")
        .build()
        .map_err(|e| NewsError {
            message: e.to_string(),
        })
}

async fn bot_client() -> Result<reqwest::Client, NewsError> {
    reqwest::Client::builder()
        .user_agent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)")
        .build()
        .map_err(|e| NewsError {
            message: e.to_string(),
        })
}

/// Fetch a Bungie.net article page with a Googlebot UA — triggers their
/// server-side rendering so the real `<div class="articleContainer__XXX">`
/// article body shows up in the returned HTML. Extract and return that
/// block so the frontend can render it inline.
///
/// SSRF protection: only allows URLs hosted on bungie.net. Any other host
/// is rejected to prevent callers from using this command to fetch arbitrary
/// external resources through the app.
#[tauri::command]
pub async fn fetch_article_body(url: String) -> Result<String, NewsError> {
    // Whitelist: must be https://www.bungie.net/ or https://bungie.net/.
    let lower = url.to_lowercase();
    if !lower.starts_with("https://www.bungie.net/") && !lower.starts_with("https://bungie.net/") {
        return Err(NewsError {
            message: "URL must be on bungie.net".into(),
        });
    }

    let client = bot_client().await?;
    let html = client
        .get(&url)
        .send()
        .await
        .map_err(|e| NewsError {
            message: e.to_string(),
        })?
        .text()
        .await
        .map_err(|e| NewsError {
            message: e.to_string(),
        })?;

    // Find `<div class="articleContainer__XXX">` — its class hash changes
    // with each Bungie deploy, so match by prefix.
    let needle = "articleContainer__";
    let Some(pos) = html.rfind(needle) else {
        return Ok(String::new());
    };
    // Walk backwards from the hash token to the opening `<div`.
    let prefix = &html[..pos];
    let Some(open_start) = prefix.rfind("<div") else {
        return Ok(String::new());
    };
    // Skip past the full opening tag.
    let after_open_attrs = &html[open_start..];
    let Some(tag_end_rel) = after_open_attrs.find('>') else {
        return Ok(String::new());
    };
    let body_start = open_start + tag_end_rel + 1;

    // Walk forward with a `<div>/</div>` depth counter to find the matching
    // closing tag.
    let mut depth: i32 = 1;
    let mut cursor = body_start;
    let bytes = html.as_bytes();
    while cursor < bytes.len() {
        if bytes[cursor] == b'<' {
            if html[cursor..].starts_with("<div") {
                depth += 1;
                cursor += 4;
                continue;
            }
            if html[cursor..].starts_with("</div>") {
                depth -= 1;
                if depth == 0 {
                    return Ok(clean_article_html(&rewrite_img_srcs(
                        &html[body_start..cursor],
                    )));
                }
                cursor += 6;
                continue;
            }
        }
        cursor += 1;
    }
    Ok(clean_article_html(&rewrite_img_srcs(&html[body_start..])))
}

#[tauri::command]
pub async fn fetch_news(game: String, api_key: String) -> Result<Vec<NewsArticle>, NewsError> {
    let client = bungie_client().await?;
    let mut articles: Vec<NewsArticle> = Vec::new();
    // Iterate a few pages so we pull several weeks of articles (RSS only
    // returns ~25 per page).
    for page in 0..4 {
        let url = format!("{}/Content/Rss/NewsArticles/{}/", BUNGIE_BASE, page);
        let Ok(body) = client
            .get(&url)
            .header("X-API-Key", &api_key)
            .send()
            .await
            .map_err(|e| NewsError {
                message: e.to_string(),
            })?
            .text()
            .await
        else {
            continue;
        };
        let Ok(parsed): Result<RssNewsResponse, _> = serde_json::from_str(&body) else {
            continue;
        };
        let entries = parsed.response.map(|r| r.news_articles).unwrap_or_default();
        if entries.is_empty() {
            break;
        }
        for entry in entries {
            if entry.title.is_empty() {
                continue;
            }
            let source = classify(&[], &entry.title, &entry.description);
            let image_url = if !entry.image_path.is_empty() {
                Some(absolutize_image_url(&entry.image_path))
            } else {
                // Fallback: extract the first <img> from the article
                // description. Many Bungie feeds embed the hero image
                // there instead of populating the ImagePath field.
                first_img_src_in_html(&entry.description)
            };
            let link = if entry.link.starts_with("http") {
                entry.link.clone()
            } else if entry.link.starts_with('/') {
                format!("https://www.bungie.net{}", entry.link)
            } else {
                format!("https://www.bungie.net/{}", entry.link)
            };
            let summary = strip_html_to_text(&entry.description)
                .chars()
                .take(280)
                .collect::<String>();
            articles.push(NewsArticle {
                title: entry.title,
                link,
                published: entry.pub_date,
                summary,
                content_html: clean_article_html(&entry.description),
                image_url,
                source,
            });
        }
    }

    let filter = game.to_lowercase();
    if filter != "all" {
        articles.retain(|a| a.source == filter || a.source == "bungie");
    }
    articles.sort_by(|a, b| b.published.cmp(&a.published));
    articles.dedup_by(|a, b| a.link == b.link);
    articles.truncate(60);
    Ok(articles)
}

// -----------------------------------------------------------------------------
// Tweets — pulled from a Nitter RSS mirror (public Twitter scrape). Falls back
// across a few mirrors for reliability. These are best-effort — if every
// mirror is down we return an empty list instead of an error.

const NITTER_INSTANCES: &[&str] = &[
    "https://nitter.net",
    "https://nitter.privacydev.net",
    "https://nitter.poast.org",
];

const BUNGIE_HANDLES: &[(&str, &str)] = &[
    ("Bungie", "Bungie"),
    ("Destiny 2 Team", "Destiny2Team"),
    ("Bungie Help", "BungieHelp"),
    ("Marathon", "MarathonTheGame"),
];

#[derive(Debug, Deserialize)]
struct NitterRss {
    channel: NitterChannel,
}

#[derive(Debug, Deserialize, Default)]
struct NitterChannel {
    #[serde(rename = "image", default)]
    image: Option<NitterImage>,
    #[serde(rename = "item", default)]
    items: Vec<NitterItem>,
}

#[derive(Debug, Deserialize, Default)]
struct NitterImage {
    #[serde(default)]
    url: String,
}

#[derive(Debug, Deserialize, Default)]
struct NitterItem {
    #[serde(default)]
    title: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    link: String,
    #[serde(default, rename = "pubDate")]
    pub_date: String,
}

async fn fetch_nitter_rss(
    client: &reqwest::Client,
    handle: &str,
) -> Option<(Option<String>, Vec<NitterItem>)> {
    for base in NITTER_INSTANCES {
        let url = format!("{}/{}/rss", base, handle);
        let Ok(resp) = client.get(&url).send().await else {
            continue;
        };
        if !resp.status().is_success() {
            continue;
        }
        let Ok(body) = resp.text().await else {
            continue;
        };
        let Ok(rss): Result<NitterRss, _> = quick_xml::de::from_str(&body) else {
            continue;
        };
        let avatar = rss.channel.image.as_ref().and_then(|i| {
            if i.url.is_empty() {
                None
            } else {
                Some(i.url.clone())
            }
        });
        return Some((avatar, rss.channel.items));
    }
    None
}

#[tauri::command]
pub async fn fetch_tweets() -> Result<Vec<Tweet>, NewsError> {
    let client = bungie_client().await?;
    let mut tweets: Vec<Tweet> = Vec::new();

    for (display_name, handle) in BUNGIE_HANDLES {
        let Some((avatar, items)) = fetch_nitter_rss(&client, handle).await else {
            continue;
        };
        for item in items.into_iter().take(5) {
            let content = strip_html_to_text(&item.description);
            let published = chrono::DateTime::parse_from_rfc2822(&item.pub_date)
                .map(|d| d.to_rfc3339())
                .unwrap_or(item.pub_date.clone());
            tweets.push(Tweet {
                author: display_name.to_string(),
                author_handle: handle.to_string(),
                author_avatar: avatar.clone(),
                content,
                published,
                link: item.link,
            });
        }
    }

    tweets.sort_by(|a, b| b.published.cmp(&a.published));
    tweets.truncate(40);
    Ok(tweets)
}
