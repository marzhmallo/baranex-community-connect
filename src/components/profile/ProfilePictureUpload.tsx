import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, X, Camera, RotateCcw, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import 'react-image-crop/dist/ReactCrop.css';

interface ProfilePictureUploadProps {
  userId: string;
  currentPhotoUrl?: string;
  onPhotoUploaded: (url: string) => void;
  userInitials?: string;
}

const ProfilePictureUpload = ({
  userId,
  currentPhotoUrl,
  onPhotoUploaded,
  userInitials = "U"
}: ProfilePictureUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const cropCanvasRef = useRef<HTMLCanvasElement>(null);
  const cameraCanvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Cache utilities
  const getCacheKey = (key: string) => `profile_picture_${userId}_${key}`;
  const getCachedData = (key: string, maxAge: number = 3300000) => { // 55 minutes default
    try {
      const cached = localStorage.getItem(getCacheKey(key));
      if (cached) {
        const data = JSON.parse(cached);
        if (Date.now() - data.timestamp < maxAge) {
          return data.value;
        }
        localStorage.removeItem(getCacheKey(key));
      }
    } catch (error) {
      console.error('Error reading cache:', error);
    }
    return null;
  };

  const setCachedData = (key: string, value: any) => {
    try {
      localStorage.setItem(getCacheKey(key), JSON.stringify({
        value,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error setting cache:', error);
    }
  };

  const clearPhotoCache = () => {
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(`profile_picture_${userId}_`)) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  };

  // Generate signed URL for display
  const generateSignedUrl = async (url: string) => {
    if (!url) return undefined;

    try {
      // Extract file path from URL (works for both public and signed URLs)
      let filePath = '';
      
      // Check if it's a public URL format
      if (url.includes('/storage/v1/object/public/profilepictures/')) {
        filePath = url.split('/storage/v1/object/public/profilepictures/')[1];
      } else if (url.includes('/storage/v1/object/sign/profilepictures/')) {
        filePath = url.split('/storage/v1/object/sign/profilepictures/')[1].split('?')[0];
      } else {
        // If it's already a file path, use it directly
        const isAdmin = await checkIfAdmin();
        const folder = isAdmin ? 'admin' : 'users';
        filePath = url.startsWith(`${folder}/`) ? url : `${folder}/${url}`;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profilepictures')
        .createSignedUrl(filePath, 600); // 10 minutes expiration

      if (signedUrlError) {
        console.error('Error generating signed URL:', signedUrlError);
        return undefined;
      }

      return signedUrlData.signedUrl;
    } catch (error) {
      console.error('Error generating signed URL:', error);
      return undefined;
    }
  };

  // Helper function to check if user is admin
  const checkIfAdmin = async () => {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    return profile?.role === 'admin';
  };

  // Generate signed URL when currentPhotoUrl changes with caching
  useEffect(() => {
    if (currentPhotoUrl) {
      // Check cache first
      const cachedUrl = getCachedData('signed_url');
      if (cachedUrl) {
        setPhotoUrl(cachedUrl);
        return;
      }

      generateSignedUrl(currentPhotoUrl).then(signedUrl => {
        if (signedUrl) {
          setPhotoUrl(signedUrl);
          setCachedData('signed_url', signedUrl);
        }
      });
    } else {
      setPhotoUrl(undefined);
      clearPhotoCache();
    }
  }, [currentPhotoUrl]);

  // Image load callback for cropping
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height,
    );
    setCrop(crop);
  }, []);

  // Drag and drop functionality
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp']
    },
    maxFiles: 1,
    multiple: false,
    noClick: true
  });

  // Camera functionality
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
          
          const handleLoadedMetadata = () => {
            if (videoRef.current) {
              videoRef.current.play().catch(console.error);
            }
          };
          
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
        }
      }, 100);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Camera Error",
        description: "Unable to access camera. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !cameraCanvasRef.current) {
      toast({
        title: "Capture Error",
        description: "Camera elements not ready. Please try again.",
        variant: "destructive"
      });
      return;
    }

    const video = videoRef.current;
    const canvas = cameraCanvasRef.current;
    
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        toast({
          title: "Capture Error", 
          description: "Failed to initialize canvas. Please try again.",
          variant: "destructive"
        });
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) {
          toast({
            title: "Capture Error",
            description: "Failed to process captured image. Please try again.",
            variant: "destructive"
          });
          return;
        }
        
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          setImageSrc(dataUrl);
          setShowCropModal(true);
          stopCamera();
        };
        reader.onerror = () => {
          toast({
            title: "Capture Error",
            description: "Failed to process captured image. Please try again.",
            variant: "destructive"
          });
        };
        reader.readAsDataURL(blob);
      }, 'image/jpeg', 0.8);
      
    } catch (error) {
      console.error('Error during capture:', error);
      toast({
        title: "Capture Error",
        description: "Failed to capture photo. Please try again.",
        variant: "destructive"
      });
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  // Cropping functionality
  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current || !cropCanvasRef.current) {
      return null;
    }

    const image = imgRef.current;
    const canvas = cropCanvasRef.current;
    
    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      if (!image.complete || image.naturalWidth === 0) {
        return null;
      }

      const scaleX = image.naturalWidth / image.width;
      const scaleY = image.naturalHeight / image.height;

      const pixelRatio = window.devicePixelRatio || 1;
      const canvasWidth = Math.floor(completedCrop.width * scaleX * pixelRatio);
      const canvasHeight = Math.floor(completedCrop.height * scaleY * pixelRatio);
      
      canvas.width = canvasWidth;
      canvas.height = canvasHeight;

      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      ctx.imageSmoothingQuality = 'high';

      const cropX = completedCrop.x * scaleX;
      const cropY = completedCrop.y * scaleY;
      const cropWidth = completedCrop.width * scaleX;
      const cropHeight = completedCrop.height * scaleY;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      
      ctx.drawImage(
        image,
        cropX,
        cropY,
        cropWidth,
        cropHeight,
        0,
        0,
        completedCrop.width * scaleX,
        completedCrop.height * scaleY
      );

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', 0.9);
      });
    } catch (error) {
      console.error('Error during crop operation:', error);
      
      if (error instanceof DOMException && error.name === 'SecurityError') {
        toast({
          title: "Crop Error",
          description: "Image security error. Please try uploading the image again.",
          variant: "destructive"
        });
      }
      
      return null;
    }
  }, [completedCrop]);

  const handleCropSave = async () => {
    try {
      if (!completedCrop) {
        toast({
          title: "Crop Error",
          description: "Please select an area to crop first.",
          variant: "destructive"
        });
        return;
      }

      const croppedBlob = await getCroppedImg();
      
      if (!croppedBlob) {
        toast({
          title: "Crop Error",
          description: "Failed to process the cropped image. Please try again.",
          variant: "destructive"
        });
        return;
      }

      await uploadFile(croppedBlob);
      setShowCropModal(false);
      setImageSrc('');
      
    } catch (error) {
      console.error('Error in handleCropSave:', error);
      toast({
        title: "Crop Error",
        description: `Failed to save cropped image: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (file: File | Blob) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const fileExt = 'jpg';
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Get user role to determine folder structure
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      const isAdmin = profile?.role === 'admin';
      const folder = isAdmin ? 'admin' : 'users';
      const filePath = `${folder}/${fileName}`;
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from('profilepictures')
        .upload(filePath, file, {
          upsert: true
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      // Get a signed URL (expires in 10 minutes)
      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('profilepictures')
        .createSignedUrl(filePath, 600);

      if (signedUrlError) {
        throw signedUrlError;
      }

      const url = signedUrlData.signedUrl;
      
      // Update the profiles table with the file path (not the signed URL)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: filePath })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Clear old cache and update with new data
      clearPhotoCache();
      setCachedData('signed_url', url);
      
      // Update local state with signed URL for immediate display
      setPhotoUrl(url);
      onPhotoUploaded(filePath); // Pass file path to parent component

      toast({
        title: "Profile picture updated",
        description: "Your profile picture has been uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Error uploading profile picture",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || '');
        setShowCropModal(true);
      });
      reader.readAsDataURL(file);
    } catch (error: any) {
      console.error('Error processing file:', error);
      toast({
        title: "File Error",
        description: error.message || "Error processing selected file",
        variant: "destructive"
      });
    } finally {
      // Reset the input
      if (event.target) event.target.value = '';
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl) return;

    try {
      // Extract file path from URL
      const urlParts = photoUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Get user role to determine folder structure
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      const isAdmin = profile?.role === 'admin';
      const folder = isAdmin ? 'admin' : 'users';
      const filePath = `${folder}/${fileName}`;

      const { error: storageError } = await supabase.storage
        .from('profilepictures')
        .remove([filePath]);

      if (storageError) {
        console.error('Storage removal error:', storageError);
      }

      // Update the profiles table to remove the photo URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture: null })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      clearPhotoCache();
      setPhotoUrl(undefined);
      onPhotoUploaded('');

      toast({
        title: "Profile picture removed",
        description: "Your profile picture has been removed"
      });
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast({
        title: "Removal failed",
        description: error.message || "Error removing profile picture",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        {/* Enhanced Upload Area with Drag & Drop */}
        <div {...getRootProps()} className={`relative ${isDragActive ? 'border-primary border-dashed border-2 bg-primary/5 rounded-lg p-2' : ''}`}>
          <div className="relative">
            <Avatar className="h-36 w-36">
              {photoUrl && (
                <AvatarImage 
                  src={photoUrl} 
                  alt="Profile picture" 
                  onError={(e) => {
                    console.error('Failed to load image:', photoUrl);
                    setPhotoUrl(undefined);
                  }}
                />
              )}
              <AvatarFallback className="text-2xl bg-muted text-muted-foreground">
                {userInitials}
              </AvatarFallback>
            </Avatar>
            {photoUrl && (
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                onClick={handleRemovePhoto}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          
          {isDragActive && (
            <div className="absolute inset-0 flex items-center justify-center bg-primary/10 rounded-lg border-2 border-dashed border-primary">
              <p className="text-primary font-medium">Drop image here</p>
            </div>
          )}
        </div>
        
        {/* Upload Progress */}
        {uploading && (
          <div className="w-full max-w-xs">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-1 text-center">Uploading...</p>
          </div>
        )}
        
        {/* Upload Buttons */}
        <div className="flex items-center gap-2">
          <input
            {...getInputProps()}
            type="file"
            id="profile-picture-upload"
            accept="image/*"
            onChange={handleUpload}
            disabled={uploading}
            className="hidden"
          />
          <label htmlFor="profile-picture-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading}
              className="cursor-pointer border-border text-foreground hover:bg-muted"
              asChild
            >
              <span>
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? "Uploading..." : "Upload Photo"}
              </span>
            </Button>
          </label>
          
          <Button
            type="button"
            variant="outline"
            disabled={uploading}
            onClick={startCamera}
            className="border-border text-foreground hover:bg-muted"
          >
            <Camera className="h-4 w-4 mr-2" />
            Camera
          </Button>
        </div>
      </div>

      {/* Camera Modal */}
      <Dialog open={showCamera} onOpenChange={stopCamera}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Capture Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <video
              ref={videoRef}
              className="w-full max-w-sm rounded-lg border"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={cameraCanvasRef} style={{ display: 'none' }} />
            <div className="flex gap-2">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button variant="outline" onClick={stopCamera}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={() => setShowCropModal(false)}>
        <DialogContent className="sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle>Crop Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            {imageSrc && (
              <div className="max-w-2xl max-h-96 overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                >
                  <img
                    ref={imgRef}
                    src={imageSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-w-full h-auto"
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>
            )}
            <canvas ref={cropCanvasRef} style={{ display: 'none' }} />
            <div className="flex gap-2">
              <Button onClick={handleCropSave} disabled={uploading}>
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  setShowCropModal(false);
                  setImageSrc('');
                }}
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProfilePictureUpload;
