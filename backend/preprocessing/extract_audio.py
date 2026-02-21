import librosa
import numpy as np
import os
import argparse
import ffmpeg
from PIL import Image

class AudioExtractor:
    def __init__(self, sr=16000, n_mels=128, hop_length=512):
        self.sr = sr
        self.n_mels = n_mels
        self.hop_length = hop_length
    
    def extract_audio_from_video(self, video_path, output_path):
        """Extract audio from video using ffmpeg"""
        try:
            (
                ffmpeg
                .input(video_path)
                .output(output_path, acodec='pcm_s16le', ac=1, ar=self.sr)
                .overwrite_output()
                .run(quiet=True)
            )
            return True
        except Exception as e:
            print(f"Error extracting audio: {e}")
            return False
    
    def audio_to_spectrogram(self, audio_path, output_dir, segment_duration=3.0):
        """Convert audio to mel-spectrogram images"""
        os.makedirs(output_dir, exist_ok=True)
        
        try:
            # Load audio
            y, sr = librosa.load(audio_path, sr=self.sr)
            
            # Calculate segment length in samples
            segment_samples = int(segment_duration * sr)
            
            spectrograms = []
            for i in range(0, len(y), segment_samples):
                segment = y[i:i + segment_samples]
                
                if len(segment) < segment_samples:
                    # Pad the last segment
                    segment = np.pad(segment, (0, segment_samples - len(segment)))
                
                # Create mel-spectrogram
                mel_spec = librosa.feature.melspectrogram(
                    y=segment, 
                    sr=sr, 
                    n_mels=self.n_mels,
                    hop_length=self.hop_length
                )
                
                # Convert to dB
                mel_spec_db = librosa.power_to_db(mel_spec, ref=np.max)
                
                # Normalize to 0-255 range
                mel_spec_norm = ((mel_spec_db - mel_spec_db.min()) / 
                               (mel_spec_db.max() - mel_spec_db.min()) * 255).astype(np.uint8)
                
                # Save as image
                output_path = os.path.join(output_dir, f"spec_{len(spectrograms):05d}.jpg")
                Image.fromarray(mel_spec_norm).save(output_path)
                spectrograms.append(output_path)
                
            print(f"Created {len(spectrograms)} spectrograms from {audio_path}")
            return spectrograms
            
        except Exception as e:
            print(f"Error creating spectrograms: {e}")
            return []
    
    def process_video(self, video_path, output_dir):
        """Complete pipeline: video -> audio -> spectrograms"""
        # Extract audio
        audio_path = os.path.join(output_dir, "audio.wav")
        
        if self.extract_audio_from_video(video_path, audio_path):
            # Create spectrograms
            spec_dir = os.path.join(output_dir, "spectrograms")
            spectrograms = self.audio_to_spectrogram(audio_path, spec_dir)
            
            # Clean up temporary audio file
            if os.path.exists(audio_path):
                os.remove(audio_path)
                
            return spectrograms
        else:
            return []

def main():
    parser = argparse.ArgumentParser(description='Extract audio and create spectrograms')
    parser.add_argument('--input', required=True, help='Input video path')
    parser.add_argument('--output', required=True, help='Output directory')
    parser.add_argument('--duration', type=float, default=3.0, help='Segment duration in seconds')
    
    args = parser.parse_args()
    
    extractor = AudioExtractor()
    spectrograms = extractor.process_video(args.input, args.output)
    print(f"Generated {len(spectrograms)} spectrograms")

if __name__ == "__main__":
    main()