import cv2
import os
import argparse
from facenet_pytorch import MTCNN
import torch
from PIL import Image
import numpy as np

class FaceExtractor:
    def __init__(self, device='cpu'):
        self.mtcnn = MTCNN(
            keep_all=False, 
            device=device,
            min_face_size=40,
            thresholds=[0.6, 0.7, 0.7]
        )
    
    def extract_faces_from_video(self, video_path, output_dir, fps_sample=1, max_frames=50):
        """Extract face crops from video"""
        os.makedirs(output_dir, exist_ok=True)
        
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            print(f"Error: Could not open video {video_path}")
            return 0
        
        fps = cap.get(cv2.CAP_PROP_FPS)
        frame_interval = int(fps // fps_sample) if fps > 0 else 1
        
        frame_count = 0
        saved_count = 0
        
        while saved_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break
                
            if frame_count % frame_interval == 0:
                # Convert BGR to RGB
                rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                pil_image = Image.fromarray(rgb_frame)
                
                # Detect face
                try:
                    box, prob = self.mtcnn.detect(pil_image)
                    
                    if box is not None and prob[0] > 0.9:  # High confidence threshold
                        x1, y1, x2, y2 = map(int, box[0])
                        
                        # Add some padding
                        padding = 20
                        h, w = rgb_frame.shape[:2]
                        x1 = max(0, x1 - padding)
                        y1 = max(0, y1 - padding)
                        x2 = min(w, x2 + padding)
                        y2 = min(h, y2 + padding)
                        
                        # Extract face
                        face = rgb_frame[y1:y2, x1:x2]
                        
                        if face.size > 0:
                            face_pil = Image.fromarray(face)
                            face_resized = face_pil.resize((224, 224))
                            
                            output_path = os.path.join(output_dir, f"face_{saved_count:05d}.jpg")
                            face_resized.save(output_path)
                            saved_count += 1
                            
                except Exception as e:
                    print(f"Error processing frame {frame_count}: {e}")
                    
            frame_count += 1
            
        cap.release()
        print(f"Extracted {saved_count} faces from {video_path}")
        return saved_count

def main():
    parser = argparse.ArgumentParser(description='Extract faces from video')
    parser.add_argument('--input', required=True, help='Input video path')
    parser.add_argument('--output', required=True, help='Output directory')
    parser.add_argument('--fps', type=int, default=1, help='Frames per second to sample')
    parser.add_argument('--max_frames', type=int, default=50, help='Maximum frames to extract')
    
    args = parser.parse_args()
    
    extractor = FaceExtractor()
    extractor.extract_faces_from_video(args.input, args.output, args.fps, args.max_frames)

if __name__ == "__main__":
    main()