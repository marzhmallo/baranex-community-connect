import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop, centerCrop, makeAspectCrop, PixelCrop } from 'react-image-crop';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Upload, Camera, X, User, Edit3, RotateCcw, Check } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import 'react-image-crop/dist/ReactCrop.css';

interface EnhancedResidentPhotoUploadProps {
  residentId: string | undefined;
  existingPhotoUrl: string | undefined;
  onPhotoUploaded: (url: string) => void;
}

const EnhancedResidentPhotoUpload = ({
  residentId,
  existingPhotoUrl,
  onPhotoUploaded
}: EnhancedResidentPhotoUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [photoUrl, setPhotoUrl] = useState<string | undefined>(undefined);
  const [showCropModal, setShowCropModal] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>('');
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Generate signed URL for display
  const generateSignedUrl = async (url: string) => {
    if (!url) return undefined;

    try {
      let filePath = '';
      
      if (url.includes('/storage/v1/object/public/residentphotos/')) {
        filePath = url.split('/storage/v1/object/public/residentphotos/')[1];
      } else if (url.includes('/storage/v1/object/sign/residentphotos/')) {
        filePath = url.split('/storage/v1/object/sign/residentphotos/')[1].split('?')[0];
      } else {
        filePath = url.startsWith('resident/') ? url : `resident/${url}`;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('residentphotos')
        .createSignedUrl(filePath, 600);

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

  useEffect(() => {
    if (existingPhotoUrl) {
      generateSignedUrl(existingPhotoUrl).then(signedUrl => {
        setPhotoUrl(signedUrl);
      });
    } else {
      setPhotoUrl(undefined);
    }
  }, [existingPhotoUrl]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    const crop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, 1, width, height),
      width,
      height,
    );
    setCrop(crop);
  }, []);

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
    multiple: false
  });

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' }
      });
      setStream(mediaStream);
      setShowCamera(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
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
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const reader = new FileReader();
        reader.addEventListener('load', () => {
          setImageSrc(reader.result?.toString() || '');
          setShowCropModal(true);
          stopCamera();
        });
        reader.readAsDataURL(blob);
      }
    }, 'image/jpeg', 0.8);
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const getCroppedImg = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imgRef.current || !canvasRef.current) return null;

    const image = imgRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    if (!ctx) return null;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width;
    canvas.height = completedCrop.height;

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      completedCrop.width,
      completedCrop.height,
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.8);
    });
  }, [completedCrop]);

  const handleCropSave = async () => {
    try {
      const croppedBlob = await getCroppedImg();
      if (!croppedBlob) {
        toast({
          title: "Crop Error",
          description: "Failed to crop image. Please try again.",
          variant: "destructive"
        });
        return;
      }

      await uploadFile(croppedBlob);
      setShowCropModal(false);
      setImageSrc('');
    } catch (error) {
      console.error('Error cropping image:', error);
      toast({
        title: "Crop Error",
        description: "Failed to crop image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const uploadFile = async (file: File | Blob) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
      const fileName = `${residentId || 'new'}-${Date.now()}.${fileExt}`;
      const filePath = `resident/${fileName}`;
      
      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90));
      }, 100);

      const { data, error } = await supabase.storage
        .from('residentphotos')
        .upload(filePath, file, {
          upsert: true
        });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (error) {
        throw error;
      }

      const { data: signedUrlData, error: signedUrlError } = await supabase.storage
        .from('residentphotos')
        .createSignedUrl(filePath, 600);

      if (signedUrlError) {
        throw signedUrlError;
      }

      const url = signedUrlData.signedUrl;
      setPhotoUrl(url);
      onPhotoUploaded(url);

      toast({
        title: "Photo uploaded",
        description: "Resident photo has been uploaded successfully"
      });
    } catch (error: any) {
      console.error('Error uploading photo:', error);
      toast({
        title: "Upload failed",
        description: error.message || "Error uploading photo",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleRemovePhoto = async () => {
    if (!photoUrl || !existingPhotoUrl) return;

    try {
      let filePath = '';
      
      if (existingPhotoUrl.includes('/storage/v1/object/public/residentphotos/')) {
        filePath = existingPhotoUrl.split('/storage/v1/object/public/residentphotos/')[1];
      } else if (existingPhotoUrl.includes('/storage/v1/object/sign/residentphotos/')) {
        filePath = existingPhotoUrl.split('/storage/v1/object/sign/residentphotos/')[1].split('?')[0];
      } else {
        filePath = existingPhotoUrl.startsWith('resident/') ? existingPhotoUrl : `resident/${existingPhotoUrl}`;
      }

      const { error } = await supabase.storage
        .from('residentphotos')
        .remove([filePath]);

      if (error) {
        throw error;
      }

      setPhotoUrl(undefined);
      onPhotoUploaded('');

      toast({
        title: "Photo removed",
        description: "Resident photo has been removed"
      });
    } catch (error: any) {
      console.error('Error removing photo:', error);
      toast({
        title: "Removal failed",
        description: error.message || "Error removing photo",
        variant: "destructive"
      });
    }
  };

  return (
    <>
      <div className="flex flex-col items-center space-y-4">
        {/* Profile Picture Display */}
        <div className="relative">
          <Avatar className="h-32 w-32 border-4 border-border">
            <AvatarImage src={photoUrl} alt="Resident photo" />
            <AvatarFallback className="bg-muted">
              <User className="h-12 w-12 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          {photoUrl && (
            <Button
              type="button"
              variant="destructive"
              size="icon"
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full shadow-lg"
              onClick={handleRemovePhoto}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          {photoUrl && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-lg bg-background"
              onClick={() => {
                // Re-open crop modal with current photo for editing
                setImageSrc(photoUrl);
                setShowCropModal(true);
              }}
            >
              <Edit3 className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Upload Progress */}
        {uploading && (
          <div className="w-full max-w-xs">
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-muted-foreground mt-1 text-center">
              Uploading... {uploadProgress}%
            </p>
          </div>
        )}

        {/* Upload Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-xs">
          {/* File Upload / Drag & Drop */}
          <div
            {...getRootProps()}
            className={`
              flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors
              ${isDragActive 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-primary hover:bg-accent/5'
              }
              ${uploading ? 'pointer-events-none opacity-50' : ''}
            `}
          >
            <input {...getInputProps()} disabled={uploading} />
            <Upload className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-xs text-center text-muted-foreground">
              {isDragActive ? 'Drop here' : 'Upload'}
            </p>
          </div>

          {/* Camera Capture */}
          <Button
            type="button"
            variant="outline"
            className="flex flex-col items-center justify-center p-4 h-auto"
            onClick={startCamera}
            disabled={uploading}
          >
            <Camera className="h-5 w-5 mb-1" />
            <span className="text-xs">Camera</span>
          </Button>
        </div>

        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Drag & drop an image, upload from files, or use your camera
        </p>
      </div>

      {/* Camera Modal */}
      <Dialog open={showCamera} onOpenChange={(open) => !open && stopCamera()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Take Photo</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center space-y-4">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              className="w-full max-w-sm rounded-lg"
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex space-x-2">
              <Button onClick={capturePhoto} className="flex-1">
                <Camera className="h-4 w-4 mr-2" />
                Capture
              </Button>
              <Button onClick={stopCamera} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Crop Modal */}
      <Dialog open={showCropModal} onOpenChange={setShowCropModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Crop Photo</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {imageSrc && (
              <div className="flex justify-center">
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    onLoad={onImageLoad}
                    className="max-w-full max-h-96"
                  />
                </ReactCrop>
              </div>
            )}
            <canvas ref={canvasRef} className="hidden" />
            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => setShowCropModal(false)}
                variant="outline"
              >
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button onClick={handleCropSave}>
                <Check className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default EnhancedResidentPhotoUpload;