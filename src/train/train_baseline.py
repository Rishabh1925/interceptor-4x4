import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import Dataset, DataLoader
from torchvision import transforms
import os
import argparse
from PIL import Image
import json
from tqdm import tqdm
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from models.student import StudentModel

class DeepfakeDataset(Dataset):
    def __init__(self, data_dir, transform=None):
        self.data_dir = data_dir
        self.transform = transform
        self.samples = []
        
        # Load real samples
        real_dir = os.path.join(data_dir, 'real')
        if os.path.exists(real_dir):
            for folder in os.listdir(real_dir):
                folder_path = os.path.join(real_dir, folder)
                if os.path.isdir(folder_path):
                    for img_file in os.listdir(folder_path):
                        if img_file.endswith(('.jpg', '.png')):
                            self.samples.append((os.path.join(folder_path, img_file), 0))  # 0 = real
        
        # Load fake samples
        fake_dir = os.path.join(data_dir, 'fake')
        if os.path.exists(fake_dir):
            for folder in os.listdir(fake_dir):
                folder_path = os.path.join(fake_dir, folder)
                if os.path.isdir(folder_path):
                    for img_file in os.listdir(folder_path):
                        if img_file.endswith(('.jpg', '.png')):
                            self.samples.append((os.path.join(folder_path, img_file), 1))  # 1 = fake
        
        print(f"Loaded {len(self.samples)} samples")
        
    def __len__(self):
        return len(self.samples)
    
    def __getitem__(self, idx):
        img_path, label = self.samples[idx]
        
        try:
            image = Image.open(img_path).convert('RGB')
            if self.transform:
                image = self.transform(image)
            return image, label
        except Exception as e:
            print(f"Error loading {img_path}: {e}")
            # Return a dummy sample
            dummy_img = torch.zeros(3, 224, 224)
            return dummy_img, label

def train_model(data_dir, save_path, epochs=5, batch_size=16, lr=1e-4):
    # Data transforms
    train_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(10),
        transforms.ColorJitter(brightness=0.2, contrast=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    # Dataset and dataloader
    dataset = DeepfakeDataset(data_dir, transform=train_transform)
    
    if len(dataset) == 0:
        print("No data found! Please add some sample videos and run preprocessing first.")
        return
    
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True, num_workers=0)
    
    # Model, loss, optimizer
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    model = StudentModel().to(device)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=lr)
    
    print(f"Training on {device} with {len(dataset)} samples")
    
    # Training loop
    model.train()
    for epoch in range(epochs):
        running_loss = 0.0
        correct = 0
        total = 0
        
        pbar = tqdm(dataloader, desc=f'Epoch {epoch+1}/{epochs}')
        for batch_idx, (images, labels) in enumerate(pbar):
            images, labels = images.to(device), labels.to(device)
            
            optimizer.zero_grad()
            outputs = model(images)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
            
            # Update progress bar
            pbar.set_postfix({
                'Loss': f'{running_loss/(batch_idx+1):.4f}',
                'Acc': f'{100.*correct/total:.2f}%'
            })
        
        epoch_loss = running_loss / len(dataloader)
        epoch_acc = 100. * correct / total
        print(f'Epoch {epoch+1}: Loss={epoch_loss:.4f}, Accuracy={epoch_acc:.2f}%')
    
    # Save model
    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    torch.save(model.state_dict(), save_path)
    print(f"Model saved to {save_path}")
    
    # Save training info
    info = {
        'epochs': epochs,
        'final_loss': epoch_loss,
        'final_accuracy': epoch_acc,
        'num_samples': len(dataset),
        'model_params': sum(p.numel() for p in model.parameters())
    }
    
    info_path = save_path.replace('.pt', '_info.json')
    with open(info_path, 'w') as f:
        json.dump(info, f, indent=2)

def main():
    parser = argparse.ArgumentParser(description='Train baseline deepfake detection model')
    parser.add_argument('--data_dir', default='data_processed', help='Data directory')
    parser.add_argument('--save_path', default='models/baseline_student.pt', help='Model save path')
    parser.add_argument('--epochs', type=int, default=5, help='Number of epochs')
    parser.add_argument('--batch_size', type=int, default=16, help='Batch size')
    parser.add_argument('--lr', type=float, default=1e-4, help='Learning rate')
    
    args = parser.parse_args()
    
    train_model(args.data_dir, args.save_path, args.epochs, args.batch_size, args.lr)

if __name__ == "__main__":
    main()