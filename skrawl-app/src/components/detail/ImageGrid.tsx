import { View, Image, StyleSheet, Pressable } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useThemeColors, radii } from '@/src/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  images: string[];
  onImagesChange: (images: string[]) => void;
}

export function ImageGrid({ images, onImagesChange }: Props) {
  const c = useThemeColors();

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
    });

    if (result.canceled) return;

    const compressed: string[] = [];
    for (const asset of result.assets) {
      const manipulated = await ImageManipulator.manipulateAsync(
        asset.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );
      compressed.push(manipulated.uri);
    }

    onImagesChange([...images, ...compressed]);
  };

  const removeImage = (index: number) => {
    onImagesChange(images.filter((_, i) => i !== index));
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {images.map((uri, i) => (
          <View key={uri + i} style={styles.thumbWrap}>
            <Image source={{ uri }} style={styles.thumb} />
            <Pressable
              onPress={() => removeImage(i)}
              style={[styles.removeBtn, { backgroundColor: c.danger }]}
            >
              <Ionicons name="close" size={10} color="#fff" />
            </Pressable>
          </View>
        ))}
        <Pressable
          style={[styles.addBtn, { borderColor: c.border, backgroundColor: c.bgCard }]}
          onPress={pickImage}
        >
          <Ionicons name="camera-outline" size={20} color={c.textDim} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  thumbWrap: {
    position: 'relative',
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
  },
  removeBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtn: {
    width: 72,
    height: 72,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
