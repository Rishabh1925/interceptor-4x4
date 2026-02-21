import torch
import torch.onnx
import os
import sys
sys.path.append(os.path.join(os.path.dirname(__file__), '..', 'src'))

from models.student import StudentModel

def export_torchscript(model_path, output_path):
    """Export model to TorchScript for PyTorch Mobile"""
    print(f"Exporting TorchScript model...")
    
    # Load model
    model = StudentModel()
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
        print(f"Loaded weights from {model_path}")
    else:
        print(f"Warning: {model_path} not found, using untrained model")
    
    model.eval()
    
    # Create example input
    example_input = torch.randn(1, 3, 224, 224)
    
    # Trace the model
    traced_model = torch.jit.trace(model, example_input)
    
    # Save traced model
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    traced_model.save(output_path)
    print(f"TorchScript model saved to {output_path}")
    
    # Test the exported model
    loaded_model = torch.jit.load(output_path)
    with torch.no_grad():
        original_output = model(example_input)
        traced_output = loaded_model(example_input)
        
    print(f"Original output shape: {original_output.shape}")
    print(f"Traced output shape: {traced_output.shape}")
    print(f"Max difference: {torch.max(torch.abs(original_output - traced_output)).item():.6f}")
    
    return output_path

def export_onnx(model_path, output_path):
    """Export model to ONNX format"""
    print(f"Exporting ONNX model...")
    
    # Load model
    model = StudentModel()
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
        print(f"Loaded weights from {model_path}")
    else:
        print(f"Warning: {model_path} not found, using untrained model")
    
    model.eval()
    
    # Create example input
    example_input = torch.randn(1, 3, 224, 224)
    
    # Export to ONNX
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    torch.onnx.export(
        model,
        example_input,
        output_path,
        export_params=True,
        opset_version=11,
        do_constant_folding=True,
        input_names=['input'],
        output_names=['output'],
        dynamic_axes={
            'input': {0: 'batch_size'},
            'output': {0: 'batch_size'}
        }
    )
    print(f"ONNX model saved to {output_path}")
    
    # Test ONNX model
    try:
        import onnxruntime as ort
        
        ort_session = ort.InferenceSession(output_path)
        ort_inputs = {ort_session.get_inputs()[0].name: example_input.numpy()}
        ort_outputs = ort_session.run(None, ort_inputs)
        
        with torch.no_grad():
            original_output = model(example_input)
        
        print(f"Original output shape: {original_output.shape}")
        print(f"ONNX output shape: {ort_outputs[0].shape}")
        print(f"Max difference: {torch.max(torch.abs(original_output.numpy() - ort_outputs[0])).item():.6f}")
        
    except ImportError:
        print("ONNX Runtime not available, skipping verification")
    
    return output_path

def get_model_info(model_path):
    """Get model information"""
    model = StudentModel()
    if os.path.exists(model_path):
        model.load_state_dict(torch.load(model_path, map_location='cpu'))
    
    total_params = sum(p.numel() for p in model.parameters())
    trainable_params = sum(p.numel() for p in model.parameters() if p.requires_grad)
    
    # Estimate model size
    param_size = 0
    for param in model.parameters():
        param_size += param.nelement() * param.element_size()
    
    buffer_size = 0
    for buffer in model.buffers():
        buffer_size += buffer.nelement() * buffer.element_size()
    
    size_mb = (param_size + buffer_size) / 1024 / 1024
    
    return {
        'total_parameters': total_params,
        'trainable_parameters': trainable_params,
        'model_size_mb': size_mb
    }

def main():
    model_path = 'models/baseline_student.pt'
    
    print("Model Export Utility")
    print("="*40)
    
    # Get model info
    info = get_model_info(model_path)
    print(f"Total parameters: {info['total_parameters']:,}")
    print(f"Trainable parameters: {info['trainable_parameters']:,}")
    print(f"Model size: {info['model_size_mb']:.2f} MB")
    print()
    
    # Export TorchScript
    torchscript_path = 'export/baseline_student_ts.pt'
    export_torchscript(model_path, torchscript_path)
    print()
    
    # Export ONNX
    onnx_path = 'export/baseline_student.onnx'
    export_onnx(model_path, onnx_path)
    print()
    
    print("Export completed!")
    print(f"TorchScript: {torchscript_path}")
    print(f"ONNX: {onnx_path}")

if __name__ == "__main__":
    main()