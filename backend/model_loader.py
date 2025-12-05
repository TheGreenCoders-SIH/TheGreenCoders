"""
Multi-Model Loader for Plant Disease and Pest Detection
Supports PlantDoc, Maize, and Rice ResNet50 models with automatic best-model selection
"""
import torch
from torch import nn
from torchvision import transforms, models
import joblib
import numpy as np
from PIL import Image
import io
from pathlib import Path
from typing import Dict, List, Tuple, Optional
import base64


class PlantDocModelLoader:
    """Loads and manages the PlantDoc ResNet50 model (29 classes) - Lazy Loading"""
    
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = None  # Lazy loading - model not loaded yet
        self.model_path = model_path
        self.model_name = "PlantDoc"
        
        # 29 PlantDoc classes
        self.classes = [
            "Apple Scab Leaf", "Apple leaf", "Apple rust leaf", "Bell_pepper leaf", "Bell_pepper leaf spot",
            "Blueberry leaf", "Cherry leaf", "Corn Gray leaf spot", "Corn leaf blight", "Corn rust leaf",
            "grape leaf", "grape leaf black rot", "Peach leaf", "Potato leaf", "Potato leaf early blight",
            "Potato leaf late blight", "Raspberry leaf", "Soyabean leaf", "Soybean leaf",
            "Squash Powdery mildew leaf", "Strawberry leaf", "Tomato Early blight leaf", "Tomato leaf",
            "Tomato leaf bacterial spot", "Tomato leaf late blight", "Tomato leaf mosaic virus",
            "Tomato leaf yellow virus", "Tomato mold leaf", "Tomato Septoria leaf spot"
        ]
        
        # Define preprocessing transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def _load_model(self):
        """Load the ResNet50 model (called on first use)"""
        try:
            print(f"🔄 Loading {self.model_name} model for the first time...")
            model = models.resnet50(weights=None)
            model.fc = nn.Linear(model.fc.in_features, len(self.classes))
            model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            model.to(self.device)
            model.eval()
            print(f"✅ {self.model_name} model loaded successfully with {len(self.classes)} classes")
            return model
        except Exception as e:
            print(f"❌ Error loading {self.model_name} model: {e}")
            raise
    
    def get_model(self):
        """Get model instance, loading it if necessary (lazy loading)"""
        if self._model is None:
            self._model = self._load_model()
        return self._model
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess PIL Image for model input"""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return self.transform(image).unsqueeze(0).to(self.device)
    
    def predict(self, image: Image.Image) -> Dict:
        """Predict disease/pest from image"""
        try:
            model = self.get_model()  # Lazy load on first prediction
            img_tensor = self.preprocess_image(image)
            
            with torch.no_grad():
                outputs = model(img_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
            confidence, predicted_idx = torch.max(probabilities, 0)
            predicted_class = self.classes[predicted_idx.item()]
            
            # Get top 5 predictions
            top5_prob, top5_idx = torch.topk(probabilities, min(5, len(self.classes)))
            top5_predictions = {
                self.classes[idx.item()]: float(prob.item()) 
                for idx, prob in zip(top5_idx, top5_prob)
            }
            
            return {
                'success': True,
                'model': self.model_name,
                'prediction': predicted_class,
                'confidence': float(confidence.item()),
                'all_predictions': top5_predictions
            }
        except Exception as e:
            return {
                'success': False,
                'model': self.model_name,
                'error': str(e)
            }


class MaizeModelLoader:
    """Loads and manages the Maize ResNet50 model (11 classes) - Lazy Loading"""
    
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = None  # Lazy loading - model not loaded yet
        self.model_path = model_path
        self.model_name = "Maize"
        
        # 11 Maize classes
        self.classes = [
            'fall army worm', 'healthy', 'herbicide burn', 'magnesium deficiency',
            'maize streak', 'multiple', 'nitrogen deficiency', 'potassium deficiency',
            'stalk borer', 'sulphur deficiency', 'zinc deficiency'
        ]
        
        # Define preprocessing transforms
        self.transform = transforms.Compose([
            transforms.Resize((224, 224)),
            transforms.ToTensor(),
            transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
        ])
    
    def _load_model(self):
        """Load the full ResNet50 model (called on first use)"""
        try:
            print(f"🔄 Loading {self.model_name} model for the first time...")
            # Load full model (saved with torch.save(model, ...))
            model = torch.load(self.model_path, map_location=self.device, weights_only=False)
            model.to(self.device)
            model.eval()
            print(f"✅ {self.model_name} model loaded successfully with {len(self.classes)} classes")
            return model
        except Exception as e:
            print(f"❌ Error loading {self.model_name} model: {e}")
            raise
    
    def get_model(self):
        """Get model instance, loading it if necessary (lazy loading)"""
        if self._model is None:
            self._model = self._load_model()
        return self._model
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess PIL Image for model input"""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return self.transform(image).unsqueeze(0).to(self.device)
    
    def predict(self, image: Image.Image) -> Dict:
        """Predict maize disease/pest from image"""
        try:
            model = self.get_model()  # Lazy load on first prediction
            img_tensor = self.preprocess_image(image)
            
            with torch.no_grad():
                outputs = model(img_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
            confidence, predicted_idx = torch.max(probabilities, 0)
            predicted_class = self.classes[predicted_idx.item()]
            
            # Get top 5 predictions
            top5_prob, top5_idx = torch.topk(probabilities, min(5, len(self.classes)))
            top5_predictions = {
                self.classes[idx.item()]: float(prob.item()) 
                for idx, prob in zip(top5_idx, top5_prob)
            }
            
            return {
                'success': True,
                'model': self.model_name,
                'prediction': predicted_class,
                'confidence': float(confidence.item()),
                'all_predictions': top5_predictions
            }
        except Exception as e:
            return {
                'success': False,
                'model': self.model_name,
                'error': str(e)
            }


class RiceModelLoader:
    """Loads and manages the Rice ResNet50 model (10 classes) - Lazy Loading"""
    
    def __init__(self, model_path: str):
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._model = None  # Lazy loading - model not loaded yet
        self.model_path = model_path
        self.model_name = "Rice"
        
        # 10 Rice classes
        self.classes = [
            'bacterial_leaf_blight',
            'bacterial_leaf_streak',
            'bacterial_panicle_blight',
            'blast',
            'brown_spot',
            'dead_heart',
            'downy_mildew',
            'hispa',
            'normal',
            'tungro'
        ]
        
        # Define preprocessing transforms
        self.transform = transforms.Compose([
            transforms.Resize((256, 256)),
            transforms.ToTensor(),
        ])
    
    def _load_model(self):
        """Load the ResNet50 model (called on first use)"""
        try:
            print(f"🔄 Loading {self.model_name} model for the first time...")
            model = models.resnet50(weights=None)
            model.fc = nn.Linear(model.fc.in_features, len(self.classes))
            model.load_state_dict(torch.load(self.model_path, map_location=self.device))
            model.to(self.device)
            model.eval()
            print(f"✅ {self.model_name} model loaded successfully with {len(self.classes)} classes")
            return model
        except Exception as e:
            print(f"❌ Error loading {self.model_name} model: {e}")
            raise
    
    def get_model(self):
        """Get model instance, loading it if necessary (lazy loading)"""
        if self._model is None:
            self._model = self._load_model()
        return self._model
    
    def preprocess_image(self, image: Image.Image) -> torch.Tensor:
        """Preprocess PIL Image for model input"""
        if image.mode != 'RGB':
            image = image.convert('RGB')
        return self.transform(image).unsqueeze(0).to(self.device)
    
    def predict(self, image: Image.Image) -> Dict:
        """Predict rice disease/pest from image"""
        try:
            model = self.get_model()  # Lazy load on first prediction
            img_tensor = self.preprocess_image(image)
            
            with torch.no_grad():
                outputs = model(img_tensor)
                probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
            confidence, predicted_idx = torch.max(probabilities, 0)
            predicted_class = self.classes[predicted_idx.item()]
            
            # Get top 5 predictions
            top5_prob, top5_idx = torch.topk(probabilities, min(5, len(self.classes)))
            top5_predictions = {
                self.classes[idx.item()]: float(prob.item()) 
                for idx, prob in zip(top5_idx, top5_prob)
            }
            
            return {
                'success': True,
                'model': self.model_name,
                'prediction': predicted_class,
                'confidence': float(confidence.item()),
                'all_predictions': top5_predictions
            }
        except Exception as e:
            return {
                'success': False,
                'model': self.model_name,
                'error': str(e)
            }


class MultiModelDetector:
    """Runs inference on all models and selects the best prediction"""
    
    def __init__(self, plantdoc_model, maize_model, rice_model):
        self.models = {
            'plantdoc': plantdoc_model,
            'maize': maize_model,
            'rice': rice_model
        }
    
    def predict(self, image: Image.Image) -> Dict:
        """
        Run inference on all models and return the prediction with highest confidence
        """
        try:
            results = []
            
            # Run prediction on all models
            for model_key, model in self.models.items():
                if model is not None:
                    result = model.predict(image)
                    if result.get('success'):
                        results.append(result)
            
            if not results:
                return {
                    'success': False,
                    'error': 'No models produced valid predictions'
                }
            
            # Select the result with highest confidence
            best_result = max(results, key=lambda x: x.get('confidence', 0))
            
            # Add information about all model predictions
            all_model_results = {
                result['model']: {
                    'prediction': result['prediction'],
                    'confidence': result['confidence']
                }
                for result in results
            }
            
            best_result['all_model_results'] = all_model_results
            best_result['selected_model'] = best_result['model']
            
            return best_result
            
        except Exception as e:
            return {
                'success': False,
                'error': f'Multi-model prediction error: {str(e)}'
            }


# Legacy class for backward compatibility
class PestModelLoader:
    """Legacy pest detection model (scikit-learn) - Lazy Loading"""
    
    def __init__(self, model_path: str):
        self._model = None  # Lazy loading - model not loaded yet
        self.model_path = model_path
    
    def _load_model(self):
        """Load the scikit-learn model (called on first use)"""
        try:
            print(f"🔄 Loading Legacy Pest model for the first time...")
            model = joblib.load(self.model_path)
            print(f"✅ Legacy Pest model loaded successfully")
            return model
        except Exception as e:
            print(f"❌ Error loading legacy pest model: {e}")
            raise
    
    def get_model(self):
        """Get model instance, loading it if necessary (lazy loading)"""
        if self._model is None:
            self._model = self._load_model()
        return self._model
    
    def predict(self, image: Image.Image) -> Dict:
        """Predict pest from image"""
        try:
            model = self.get_model()  # Lazy load on first prediction
            
            image = image.convert('RGB')
            image = image.resize((224, 224))
            
            img_array = np.array(image)
            img_flattened = img_array.flatten().reshape(1, -1)
            img_normalized = img_flattened / 255.0
            
            prediction = model.predict(img_normalized)[0]
            
            confidence = 0.85
            all_predictions = {}
            
            if hasattr(model, 'predict_proba'):
                probabilities = model.predict_proba(img_normalized)[0]
                classes = model.classes_
                pred_idx = np.where(classes == prediction)[0][0]
                confidence = float(probabilities[pred_idx])
                
                top_indices = np.argsort(probabilities)[-5:][::-1]
                all_predictions = {
                    str(classes[i]): float(probabilities[i]) 
                    for i in top_indices
                }
            
            return {
                'success': True,
                'prediction': str(prediction),
                'confidence': confidence,
                'all_predictions': all_predictions
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e)
            }


def load_image_from_base64(base64_string: str) -> Image.Image:
    """Convert base64 string to PIL Image"""
    if ',' in base64_string:
        base64_string = base64_string.split(',')[1]
    
    image_data = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_data))
    return image


def load_image_from_bytes(image_bytes: bytes) -> Image.Image:
    """Convert bytes to PIL Image"""
    return Image.open(io.BytesIO(image_bytes))
