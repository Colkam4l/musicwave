use crate::search::SongResult;
use std::collections::VecDeque;
use std::sync::LazyLock;
use tokio::sync::Mutex;

pub const MAX_QUEUE_LEN: usize = 200;

static PLAY_QUEUE: LazyLock<Mutex<VecDeque<SongResult>>> =
    LazyLock::new(|| Mutex::new(VecDeque::new()));

/// Inserts a song at the front of the queue so it plays next.
pub async fn enqueue_next(song: SongResult) -> anyhow::Result<Vec<SongResult>> {
    let mut queue = PLAY_QUEUE.lock().await;
    if queue.len() >= MAX_QUEUE_LEN {
        anyhow::bail!("Queue is full ({MAX_QUEUE_LEN} songs max).");
    }
    queue.push_front(song);
    Ok(queue.iter().cloned().collect())
}

/// Appends a song to the end of the queue.
pub async fn enqueue_last(song: SongResult) -> anyhow::Result<Vec<SongResult>> {
    let mut queue = PLAY_QUEUE.lock().await;
    if queue.len() >= MAX_QUEUE_LEN {
        anyhow::bail!("Queue is full ({MAX_QUEUE_LEN} songs max).");
    }
    queue.push_back(song);
    Ok(queue.iter().cloned().collect())
}

/// Removes and returns the next song at the front of the queue, if any.
pub async fn dequeue_front() -> Option<SongResult> {
    let mut queue = PLAY_QUEUE.lock().await;
    queue.pop_front()
}

/// Removes the queued song at `index`, returning the updated queue.
pub async fn remove_at(index: usize) -> Vec<SongResult> {
    let mut queue = PLAY_QUEUE.lock().await;
    if index < queue.len() {
        queue.remove(index);
    }
    queue.iter().cloned().collect()
}

/// Moves a queued song from `from` index to `to` index, returning the updated queue.
pub async fn reorder(from: usize, to: usize) -> Vec<SongResult> {
    let mut queue = PLAY_QUEUE.lock().await;
    let len = queue.len();
    if from < len
        && to < len
        && from != to
        && let Some(item) = queue.remove(from)
    {
        queue.insert(to, item);
    }
    queue.iter().cloned().collect()
}

/// Clears all songs from the queue and returns an empty list.
pub async fn clear_queue() -> Vec<SongResult> {
    let mut queue = PLAY_QUEUE.lock().await;
    queue.clear();
    Vec::new()
}

/// Shuffles the current queue in-place and returns the updated list.
pub async fn shuffle_queue() -> Vec<SongResult> {
    use std::time::SystemTime;
    let mut queue = PLAY_QUEUE.lock().await;
    let mut vec: Vec<SongResult> = queue.drain(..).collect();
    let mut state = SystemTime::now()
        .duration_since(SystemTime::UNIX_EPOCH)
        .map(|d| d.as_nanos() as u64)
        .unwrap_or(0x853c49e6748fea9b);
    if state == 0 {
        state = 0x853c49e6748fea9b;
    }
    for i in (1..vec.len()).rev() {
        state ^= state >> 12;
        state ^= state << 25;
        state ^= state >> 27;
        let r = (state.wrapping_mul(0x2545F4914F6CDD1D) >> 32) as usize;
        let j = r % (i + 1);
        vec.swap(i, j);
    }
    for song in vec {
        queue.push_back(song);
    }
    queue.iter().cloned().collect()
}

/// Returns a snapshot of the current queue in playback order.
pub async fn get_queue() -> Vec<SongResult> {
    let queue = PLAY_QUEUE.lock().await;
    queue.iter().cloned().collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    fn sample_song(id: &str) -> SongResult {
        SongResult {
            video_id: id.to_string(),
            title: format!("Title {id}"),
            artist: "Artist".to_string(),
            album: None,
            duration: Some("3:00".to_string()),
            duration_seconds: Some(180),
            thumbnail_url: None,
        }
    }

    #[tokio::test]
    async fn test_queue_operations_and_capacity() {
        clear_queue().await;

        let list = enqueue_last(sample_song("a")).await.unwrap();
        assert_eq!(list.len(), 1);
        let list = enqueue_next(sample_song("b")).await.unwrap();
        assert_eq!(list[0].video_id, "b");
        assert_eq!(list[1].video_id, "a");

        let reordered = reorder(0, 1).await;
        assert_eq!(reordered[0].video_id, "a");
        assert_eq!(reordered[1].video_id, "b");

        let removed = remove_at(0).await;
        assert_eq!(removed.len(), 1);
        assert_eq!(removed[0].video_id, "b");

        let popped = dequeue_front().await.unwrap();
        assert_eq!(popped.video_id, "b");
        assert!(dequeue_front().await.is_none());

        for i in 0..MAX_QUEUE_LEN {
            enqueue_last(sample_song(&format!("s{i}"))).await.unwrap();
        }
        let overflow = enqueue_last(sample_song("overflow")).await;
        assert!(overflow.is_err());

        assert!(clear_queue().await.is_empty());
    }
}
