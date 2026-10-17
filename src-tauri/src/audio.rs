use reqwest::Client;
use rodio::{Decoder, DeviceSinkBuilder, MixerDeviceSink, Player};
use std::io::BufReader;
use std::sync::Arc;
use stream_download::http::HttpStream;
use stream_download::storage::temp::TempStorageProvider;
use stream_download::{Settings, StreamDownload};
use tokio::sync::Mutex;

pub struct AudioPlayer {
    player: Option<Player>,
    sink: Option<MixerDeviceSink>,
}

impl Default for AudioPlayer {
    fn default() -> Self {
        Self::new()
    }
}

impl AudioPlayer {
    pub fn new() -> Self {
        let (sink, player) = match DeviceSinkBuilder::open_default_sink() {
            Ok(sink) => {
                let player = Player::connect_new(sink.mixer());
                (Some(sink), Some(player))
            }
            Err(e) => {
                eprintln!("Warning: failed to open default audio device on startup: {e:?}");
                (None, None)
            }
        };

        Self { player, sink }
    }

    fn ensure_player(&mut self) -> anyhow::Result<&Player> {
        if self.player.is_none() {
            let sink = DeviceSinkBuilder::open_default_sink()
                .map_err(|e| anyhow::anyhow!("Failed to open default audio device: {:?}", e))?;
            let player = Player::connect_new(sink.mixer());
            self.sink = Some(sink);
            self.player = Some(player);
        }
        Ok(self.player.as_ref().unwrap())
    }

    pub async fn play_stream(&mut self, url: &str, client: Client) -> anyhow::Result<()> {
        let stream_url = url.parse()?;
        let stream = HttpStream::new(client, stream_url).await?;
        let reader =
            StreamDownload::from_stream(stream, TempStorageProvider::new(), Settings::default())
                .await?;

        let source = Decoder::new_mp4(BufReader::new(reader))?;
        let player = self.ensure_player()?;
        player.stop();
        player.append(source);
        player.play();
        Ok(())
    }

    pub fn pause(&self) {
        if let Some(player) = &self.player {
            player.pause();
        }
    }

    pub fn play(&self) {
        if let Some(player) = &self.player {
            player.play();
        }
    }

    pub fn stop(&self) {
        if let Some(player) = &self.player {
            player.stop();
        }
    }
}

pub type SharedAudioPlayer = Arc<Mutex<AudioPlayer>>;
