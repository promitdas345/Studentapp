// "What we collect", opened from Settings (PRODUCT.md S12): the same words the student agreed to
// on S2, to read again at any time.
import { StyleSheet, Text, View } from 'react-native';

import { Body, Button, Screen, Title, colors } from '../components/ui';
import { en } from '../copy/en';
import { goBack } from '../lib/nav';

const copy = en.collect;

export default function CollectInfo() {
  return (
    <Screen>
      <Title>{copy.title}</Title>
      <View style={styles.list}>
        {copy.collected.map((line) => (
          <Text key={line} style={styles.bullet}>
            {`•  ${line}`}
          </Text>
        ))}
      </View>
      <Body>{copy.notCollected}</Body>
      <Body>{copy.notCounselling}</Body>
      <Button label={en.common.back} kind="quiet" onPress={goBack} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  bullet: { fontSize: 17, lineHeight: 24, color: colors.text },
});
