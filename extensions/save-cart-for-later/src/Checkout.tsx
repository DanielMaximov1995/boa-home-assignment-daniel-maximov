import {
  reactExtension,
  BlockStack,
  InlineStack,
  Checkbox,
  Button,
  Text,
  useCartLines,
  ChoiceList,
  Choice,
  useApplyCartLinesChange,
  useCustomer
} from "@shopify/ui-extensions-react/checkout";
import { CartLineChange } from "@shopify/ui-extensions/checkout";
import { useEffect, useState } from "react";

export default reactExtension("purchase.checkout.block.render", () => (
  <Extension />
));

function Extension() {
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [selectedItems, setSelectedItems] = useState([]);
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [loading, setLoading] = useState(false)
  const customer = useCustomer();

  console.log(customer);
  

  const handleCheckboxChange = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
    setError("")
    setSuccess("")
  };

  const handleSaveForLater = async () => {
    if (selectedItems.length === 0) {
      setError('Please select at least one item to save for later.');
      return;
    }

    setLoading(true)

    const changes: CartLineChange[] = selectedItems.map((id) => {
      const findProduct = cartLines.find(product => product.id === id)

      if (!findProduct) {
        return;
      }

      return {
        type: 'removeCartLine',
        id,
        quantity: findProduct.quantity,
      }
    });

    for (const change of changes.filter(change => change !== undefined)) {
      const result = await applyCartLinesChange(change);
      if (result.type !== 'success') {
        setError('Failed to save items for later. Please try again.');
        return;
      }
    }
    setSuccess('Selected items have been saved for later.');

    try {
      const response = await fetch('/proxy/save-cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items: selectedItems })
      });

      if (!response.ok) {
        console.error('Failed to save items for later on the server.');
      }
    } catch (error) {
      console.error('Error saving items for later:', error);
    } finally {
      setLoading(false)
    }
  };

  return (
    <BlockStack
      spacing="loose"
      background="subdued"
      borderRadius="loose"
      padding="loose"
      accessibilityRole="section"
    >
      <Text size="extraLarge" appearance="info" emphasis="bold">
            Save your cart for later
          </Text>
      {customer?.id ? ( 
        <>
          {cartLines.length > 0 ? (
            cartLines.map((line) => (
              <InlineStack key={line.id} spacing="tight">
                <ChoiceList
                  name={line.merchandise.title}
                  value={selectedItems}
                  onChange={() => handleCheckboxChange(line.id)}
                >
                  <Choice id={line.id}>{line.merchandise.title}</Choice>
                </ChoiceList>
              </InlineStack>
            ))
          ) : (
            <Text size="small">No items found in your cart.</Text>
          )}
          <BlockStack spacing="none">
            <Button loading={loading} onPress={handleSaveForLater}>
              Save Cart
            </Button>
            {error && <Text appearance="critical">{error}</Text>}
            {success && <Text appearance="success">{success}</Text>}
          </BlockStack>
        </>
      ) : (
        <Text size="large" appearance="warning">
          To save your cart for later, please log in.
        </Text>
      )}
    </BlockStack>
  );
}
