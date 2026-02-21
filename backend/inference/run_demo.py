import torch
import torch.nn.functional as F
from torchvision import transforms
from torchcam.methods import GradCAM
import cv2
import numpy as np
import argparse
import os
import sys
from PIL import Image
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '..'))
from models.student import StudentModel
from preprocessing.extract_faces import FaceExtractor

class DeepfakeDetector:
    def __init__(self, model_path, device='cpu'):
        self.device = torch.device(device)
        self.model = StudentModel()
        
        # Load trained weights
        if os.path.exists(model_path):
            self.model.load_state_dict(torch.load(model_path, map_location=self.device))
            print(f"Loaded model from {model_path}")
        else:
            print(f"Warning: Model file {model_path} not found. Using untrained model.")
        
        self.model.to(self.device)
        self.model.eval()
        
        # Setup transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
        ])
        
        # Setup face extractor
        self.face_extractor = FaceExtractor(device=str(self.device))
        
        # Setup GradCAM for explainability
        self.cam_extractor = GradCAM(self.model, target_layer='backbone.features')
    
    def detect_single_image(self, image_path):
        """Detect deepfake in a single image"""
        try:
            image = Image.open(image_path).convert('RGB')
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            with torch.no_grad():
                outputs = self.model(input_tensor)
                probabilities = F.softmax(outputs, dim=1)
                confidence = probabilities.max().item()
                predicted = outputs.argmax(1).item()
                
            return {
                'prediction': 'fake' if predicted == 1 else 'real',
                'confidence': confidence,
                'fake_probability': probabilities[0][1].item(),
                'real_probability': probabilities[0][0].item()
            }
        except Exception as e:
            print(f"Error processing image {image_path}: {e}")
            return None
    
    def detect_video(self, video_path, output_dir='demo_output'):
        """Detect deepfake in video by analyzing extracted faces"""
        os.makedirs(output_dir, exist_ok=True)
        
        # Extract faces from video
        faces_dir = os.path.join(output_dir, 'faces')
        num_faces = self.face_extractor.extract_faces_from_video(
            video_path, faces_dir, fps_sample=2, max_frames=20
        )
        
        if num_faces == 0:
            return {
                'error': 'No faces detected in video',
                'prediction': 'unknown',
                'confidence': 0.0
            }
        
        # Analyze each face
        predictions = []
        confidences = []
        
        for i in range(num_faces):
            face_path = os.path.join(faces_dir, f'face_{i:05d}.jpg')
            if os.path.exists(face_path):
                result = self.detect_single_image(face_path)
                if result:
                    predictions.append(1 if result['prediction'] == 'fake' else 0)
                    confidences.append(result['confidence'])
                    
                    # Generate heatmap for first few faces
                    if i < 3:
                        self.generate_heatmap(face_path, os.path.join(output_dir, f'heatmap_{i}.jpg'))
        
        if not predictions:
            return {
                'error': 'Could not analyze any faces',
                'prediction': 'unknown',
                'confidence': 0.0
            }
        
        # Aggregate results
        avg_prediction = np.mean(predictions)
        avg_confidence = np.mean(confidences)
        
        # Agent decision logic
        if avg_confidence > 0.85:
            decision = 'high_confidence'
        elif avg_confidence > 0.6:
            decision = 'medium_confidence'
        else:
            decision = 'low_confidence'
        
        final_prediction = 'fake' if avg_prediction > 0.5 else 'real'
        
        result = {
            'prediction': final_prediction,
            'confidence': avg_confidence,
            'decision_level': decision,
            'num_faces_analyzed': len(predictions),
            'individual_predictions': predictions,
            'individual_confidences': confidences,
            'fake_probability': avg_prediction,
            'agent_recommendation': self.get_agent_recommendation(avg_confidence, final_prediction)
        }
        
        # Save results
        with open(os.path.join(output_dir, 'results.json'), 'w') as f:
            json.dump(result, f, indent=2)
        
        return result
    
    def generate_heatmap(self, image_path, output_path):
        """Generate GradCAM heatmap for explainability"""
        try:
            image = Image.open(image_path).convert('RGB')
            input_tensor = self.transform(image).unsqueeze(0).to(self.device)
            
            # Generate activation map
            activation_map = self.cam_extractor(1, input_tensor)[0]  # Target class 1 (fake)
            
            # Convert to numpy and resize
            heatmap = activation_map.cpu().numpy()
            heatmap = cv2.resize(heatmap, (224, 224))
            
            # Normalize to 0-255
            heatmap = ((heatmap - heatmap.min()) / (heatmap.max() - heatmap.min()) * 255).astype(np.uint8)
            
            # Apply colormap
            heatmap_colored = cv2.applyColorMap(heatmap, cv2.COLORMAP_JET)
            
            # Load original image and overlay
            original = cv2.imread(image_path)
            original = cv2.resize(original, (224, 224))
            
            # Blend images
            overlay = cv2.addWeighted(original, 0.6, heatmap_colored, 0.4, 0)
            
            cv2.imwrite(output_path, overlay)
            print(f"Heatmap saved to {output_path}")
            
        except Exception as e:
            print(f"Error generating heatmap: {e}")
    
    def get_agent_recommendation(self, confidence, prediction):
        """Agent decision policy"""
        if confidence > 0.9:
            if prediction == 'fake':
                return "ALERT: High confidence deepfake detected. Immediate verification recommended."
            else:
                return "CLEAR: High confidence authentic content."
        elif confidence > 0.7:
            return f"CAUTION: Medium confidence {prediction}. Consider additional verification."
        else:
            return "UNCERTAIN: Low confidence prediction. Manual review strongly recommended."

def main():
    parser = argparse.ArgumentParser(description='Run deepfake detection demo')
    parser.add_argument('--video', required=True, help='Input video path')
    parser.add_argument('--model', default='models/baseline_student.pt', help='Model path')
    parser.add_argument('--output', default='demo_output', help='Output directory')
    parser.add_argument('--device', default='cpu', help='Device to use')
    
    args = parser.parse_args()
    
    detector = DeepfakeDetector(args.model, args.device)
    result = detector.detect_video(args.video, args.output)
    
    print("\n" + "="*50)
    print("DEEPFAKE DETECTION RESULTS")
    print("="*50)
    print(f"Prediction: {result.get('prediction', 'unknown').upper()}")
    print(f"Confidence: {result.get('confidence', 0):.2%}")
    print(f"Decision Level: {result.get('decision_level', 'unknown')}")
    print(f"Faces Analyzed: {result.get('num_faces_analyzed', 0)}")
    print(f"Agent Recommendation: {result.get('agent_recommendation', 'N/A')}")
    print("="*50)

if __name__ == "__main__":
    main()