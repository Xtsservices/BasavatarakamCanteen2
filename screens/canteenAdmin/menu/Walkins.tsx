import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  Dimensions,
  Modal,
  ScrollView,
} from "react-native";
import NetInfo from "@react-native-community/netinfo";
import RNPrint from "react-native-print";

interface MenuItem {
  id: number;
  name: string;
  description: string;
  price: string;
  foodType: "veg" | "non-veg";
  image: string;
  categoryName: string;
  quantity: number;
}

const { width } = Dimensions.get("window");
const isTablet = width >= 763;
const isLargeTablet = width >= 1024;
const numColumns = isLargeTablet ? 4 : isTablet ? 4 : 2;

const Walkins: React.FC = () => {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isCartModalVisible, setIsCartModalVisible] = useState<boolean>(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState<boolean>(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      setIsConnected(state.isConnected ?? false);
      if (state.isConnected) {
        fetchMenuItems();
        getAllCategories();
      }
    });
    fetchMenuItems();
    getAllCategories();
    return () => unsubscribe();
  }, []);

  const getAllCategories = async () => {
    if (!isConnected) return;
    try {
      setLoading(true);
      //72.60.102.11
      //72.60.102.11

      const response = await fetch("http://72.60.102.11:3100/api/categories/getAllCategories/4");
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        const cats: string[] = result.data.map((cat: any) => cat.name);
        console.log("Fetched categories:", cats);
        setCategories(cats);
        if (cats.length > 0 && !selectedCategory) {
          setSelectedCategory(cats[0]); // default select first
        }
      }
    } catch (error) {
      console.error("Categories error:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenuItems = async () => {
    if (!isConnected) {
      Alert.alert("No Internet", "Please connect to the internet.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch("http://72.60.102.11:3100/api/items/getItemsByCanteenforweb/4");
      const result = await response.json();

      if (result.data && Array.isArray(result.data)) {
        const items: MenuItem[] = result.data.map((item: any) => ({
          id: item.id,
          name: item.name,
          description: item.description || "No description available",
          price: item.price || "0",
          foodType: item.foodType?.toLowerCase() === "non-veg" ? "non-veg" : "veg",
          image: item.image || "",
          categoryName: item.categoryName || "Others",
          quantity: 0,
        }));
        setMenuItems(items);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to load menu.");
    } finally {
      setLoading(false);
    }
  };

  // Filter items by selected category + search
  const filteredItems = useMemo(() => {
    let items = menuItems;

    if (selectedCategory && selectedCategory !== "All") {
      items = items.filter((item) => item.categoryName === selectedCategory);
    }

    if (searchQuery.trim()) {
      items = items.filter((item) =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return items;
  }, [menuItems, selectedCategory, searchQuery]);

  const groupedData = useMemo(() => {
    const grouped: { [key: string]: MenuItem[] } = {};
    filteredItems.forEach((item) => {
      const cat = item.categoryName || "Others";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    return Object.keys(grouped)
      .sort()
      .map((category) => ({
        title: category,
        data: grouped[category],
      }));
  }, [filteredItems]);

  const increaseQuantity = (id: number) => {
    setMenuItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: item.quantity + 1 } : item))
    );
  };

  const decreaseQuantity = (id: number) => {
    setMenuItems((prev) =>
      prev.map((item) =>
        item.id === id && item.quantity > 0 ? { ...item, quantity: item.quantity - 1 } : item
      )
    );
  };

  const totalItems = menuItems.reduce((sum, item) => sum + item.quantity, 0);
  const totalAmount = menuItems.reduce(
    (sum, item) => sum + parseFloat(item.price || "0") * item.quantity,
    0
  );

  const handlePrintBill = () => {
    if (totalItems === 0) {
      Alert.alert("Empty Cart", "Please add items first.");
      return;
    }
    setIsPaymentModalVisible(true); // Show Cash/UPI modal
  };

  const confirmPaymentAndPrint = async (paymentMode: "Cash" | "UPI") => {
    setIsPaymentModalVisible(false);

    const orderedItems = menuItems.filter((item) => item.quantity > 0);
    const now = new Date();
    const dateTime = now.toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });

    const paymentText = paymentMode === "Cash" ? "Paid by Cash" : "Paid by UPI";

    const html = `
<html>
<head>
  <style>
    body { font-family: Arial; margin: 15px; font-size: 42px; }
    .header { text-align: center; font-weight: bold; font-size: 46px; margin-bottom: 10px; }
    .datetime { text-align: center; font-size: 42px; margin-bottom: 20px; border-bottom: 2px dashed #000; padding-top: 15px;}
    .row { display: flex; justify-content: space-between; margin: 8px 0; font-size: 36px; }
    .total { border-top: 2px dashed #000; padding-top: 15px; margin-top: 20px; font-weight: bold; font-size: 42px; }
    .payment { text-align: center; font-size: 40px; margin-top: 20px; font-weight: bold; }
    .footer { text-align: center; margin-top: 40px; margin-bottom: 80px; font-size: 38px; border-top: 2px dashed #000; padding-top: 15px; }
  </style>
</head>
<body>
  <div class="header">Pranavi's Samskriti (bakery)</div>
  <div class="datetime">${dateTime}</div>
  <div class="items">
    ${orderedItems
      .map(
        (item) => `
      <div class="row">
        <span>${item.name} × ${item.quantity}</span>
        <span>₹${(parseFloat(item.price) * item.quantity).toFixed(2)}</span>
      </div>`
      )
      .join("")}
  </div>
  <div class="total">
    <div class="row">
      <span>Total Amount</span>
      <span>₹${totalAmount.toFixed(2)}</span>
    </div>
  </div>
  <div class="footer">
    Thank'S  For Choosing WORLDTEK
  </div>
</body>
</html>`;

    try {
      await RNPrint.print({ html });
      Alert.alert("Success", `Bill printed! Paid via ${paymentMode}`);

      // Save order
      const body = {
        mobileNumber: "0000000000",
        canteenId: 4,
        items: orderedItems.map((item) => ({
          itemId: item.id,
          quantity: item.quantity,
        })),
        totalAmount: totalAmount,
        payment: {
          payment_status: "success",
          amount: totalAmount,
          payment_method: paymentMode.toLowerCase(),
        },
      };

      await fetch("http://72.60.102.11:3100/api/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      // Reset cart
      setMenuItems((prev) => prev.map((item) => ({ ...item, quantity: 0 })));
      setIsCartModalVisible(false);
    } catch (err) {
      Alert.alert("Print Failed", "Could not print the bill.");
    }
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  const renderItemCard = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity style={styles.itemCard} activeOpacity={0.9} onPress={() => increaseQuantity(item.id)}>
      <View style={styles.imageContainer}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={styles.itemImage} />
        ) : (
          <View style={[styles.itemImage, styles.placeholder]}>
            <Text style={styles.placeholderText}>Plate</Text>
          </View>
        )}
        <View style={[styles.foodTypeBadge, item.foodType === "veg" ? styles.vegBadge : styles.nonVegBadge]}>
          <View style={[styles.foodTypeIndicator, item.foodType === "veg" ? styles.vegIndicator : styles.nonVegIndicator]} />
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.description} numberOfLines={2}>{truncateText(item.description, 60)}</Text>
        <Text style={styles.price}>₹{parseFloat(item.price).toFixed(2)}</Text>
      </View>

      <View style={styles.quantityContainer} pointerEvents="box-none">
        {item.quantity === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              increaseQuantity(item.id);
            }}
          >
            <Text style={styles.addText}>ADD +</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.counter}>
            <TouchableOpacity style={styles.counterBtn} onPress={(e) => { e.stopPropagation(); decreaseQuantity(item.id); }}>
              <Text style={styles.counterText}>−</Text>
            </TouchableOpacity>
            <Text style={styles.counterValue}>{item.quantity}</Text>
            <TouchableOpacity style={styles.counterBtn} onPress={(e) => { e.stopPropagation(); increaseQuantity(item.id); }}>
              <Text style={styles.counterText}>+</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderSection = ({ item }: { item: { title: string; data: MenuItem[] } }) => {
    const itemsToRender = [...item.data];
    const remainder = itemsToRender.length % numColumns;
    if (remainder !== 0) {
      const placeholdersNeeded = numColumns - remainder;
      for (let i = 0; i < placeholdersNeeded; i++) {
        itemsToRender.push({ id: -(i + 1), name: "", description: "", price: "0", foodType: "veg", image: "", categoryName: "", quantity: 0 } as MenuItem);
      }
    }

    return (
      <View>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>{item.title}</Text>
            <View style={styles.sectionLine} />
          </View>
        </View>
        <FlatList
          data={itemsToRender}
          renderItem={({ item }) => {
            if (item.id < 0) return <View style={[styles.itemCard, styles.placeholderCard]} />;
            return renderItemCard({ item });
          }}
          keyExtractor={(i) => i.id > 0 ? i.id.toString() : `placeholder-${i.id}`}
          numColumns={numColumns}
          columnWrapperStyle={styles.columnWrapper}
          scrollEnabled={false}
        />
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={styles.loadingText}>Loading delicious menu...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Fixed Header */}
      <View style={styles.fixedHeader}>
        <View>
          <Text style={styles.title}>Pranavi's samskriti (bakery)</Text>
          <Text style={styles.subtitle}>Select your favorites</Text>
        </View>
        <TouchableOpacity style={styles.syncButton} onPress={fetchMenuItems}>
          <Text style={styles.syncText}>Sync</Text>
        </TouchableOpacity>
      </View>

      <View style={{ flex: 1, flexDirection: "row" }}>
        {/* Scrollable Sidebar */}
        <View style={styles.sidebar}>
          <Text style={styles.sidebarTitle}>Categories</Text>
          {/* bottom side need to be scrollable and padding need to be added */}
          <ScrollView showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: 80 }}>
            <TouchableOpacity
              style={[styles.sidebarItem, selectedCategory === null && styles.sidebarItemActive]}
              onPress={() => setSelectedCategory(null)}
            >
              <Text style={[styles.sidebarItemText, selectedCategory === null && styles.sidebarItemTextActive]}>
                All Items
              </Text>
            </TouchableOpacity>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.sidebarItem, selectedCategory === cat && styles.sidebarItemActive]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[styles.sidebarItemText, selectedCategory === cat && styles.sidebarItemTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Main Content Area */}
        <View style={{ flex: 1 }}>
          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>Search</Text>
            <TextInput
              style={styles.searchInput}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search items..."
              placeholderTextColor="#999"
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
                <Text style={styles.clearText}>Clear</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Items List */}
          <FlatList
            ref={flatListRef}
            data={groupedData}
            renderItem={renderSection}
            keyExtractor={(item) => item.title}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingBottom: totalItems > 0 ? 180 : 100 }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>Plate</Text>
                <Text style={styles.noResults}>
                  {searchQuery || selectedCategory ? "No items found" : "Menu is empty"}
                </Text>
              </View>
            }
          />
        </View>
      </View>

      {/* Cart Modal */}
      <Modal animationType="slide" transparent={true} visible={isCartModalVisible} onRequestClose={() => setIsCartModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Your Cart ({totalItems} items)</Text>
              <TouchableOpacity onPress={() => setIsCartModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={menuItems.filter((i) => i.quantity > 0)}
              keyExtractor={(i) => i.id.toString()}
              renderItem={({ item }) => (
                <View style={styles.cartItem}>
                  <View style={styles.cartItemInfo}>
                    <Text style={styles.cartItemName}>{item.name}</Text>
                    <Text style={styles.cartItemPrice}>₹{parseFloat(item.price).toFixed(2)} each</Text>
                  </View>
                  <View style={styles.cartItemActions}>
                    <TouchableOpacity style={styles.modalCounterBtn} onPress={() => decreaseQuantity(item.id)}>
                      <Text style={styles.modalCounterText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalCounterValue}>{item.quantity}</Text>
                    <TouchableOpacity style={styles.modalCounterBtn} onPress={() => increaseQuantity(item.id)}>
                      <Text style={styles.modalCounterText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={styles.cartItemTotal}>
                    ₹{(parseFloat(item.price) * item.quantity).toFixed(2)}
                  </Text>
                </View>
              )}
              ListEmptyComponent={<Text style={styles.emptyCartText}>Cart is empty</Text>}
            />
            <View style={styles.modalTotal}>
              <Text style={styles.modalTotalLabel}>Total</Text>
              <Text style={styles.modalTotalAmount}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsCartModalVisible(false)}>
                <Text style={styles.modalCloseBtnText}>Continue</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalPrintBtn} onPress={handlePrintBill}>
                <Text style={styles.modalPrintBtnText}>Print Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Payment Mode Modal */}
      <Modal transparent={true} visible={isPaymentModalVisible} animationType="fade">
        <View style={styles.paymentOverlay}>
          <View style={styles.paymentModal}>
            <Text style={styles.paymentTitle}>Select Payment Mode</Text>
            <View style={styles.paymentButtons}>
              <TouchableOpacity
                style={[styles.paymentBtn, styles.cashBtn]}
                onPress={() => confirmPaymentAndPrint("Cash")}
              >
                <Text style={styles.paymentBtnText}>Cash</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.paymentBtn, styles.upiBtn]}
                onPress={() => confirmPaymentAndPrint("UPI")}
              >
                <Text style={styles.paymentBtnText}>UPI</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.paymentCancel} onPress={() => setIsPaymentModalVisible(false)}>
              <Text style={styles.paymentCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Fixed Bottom Bar */}
      {totalItems > 0 && (
        <View style={styles.footer}>
          <View style={styles.footerContent}>
            <TouchableOpacity style={styles.summary} onPress={() => setIsCartModalVisible(true)}>
              <Text style={styles.summaryLabel}>Total Items</Text>
              <Text style={styles.summaryText}>{totalItems} items</Text>
            </TouchableOpacity>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabel}>Amount</Text>
              <Text style={styles.totalText}>₹{totalAmount.toFixed(2)}</Text>
            </View>
            <TouchableOpacity style={styles.printBtn} onPress={handlePrintBill}>
              <Text style={styles.printBtnText}>Print Bill</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.poweredBy}>
            <Text style={styles.poweredByText}>Powered by </Text>
            <Text style={styles.worldtekText}>WorldTek</Text>
          </View>
        </View>
      )}

      {totalItems === 0 && (
        <View style={styles.emptyFooter}>
          <Text style={styles.poweredByText}>Powered by </Text>
          <Image source={require("../../images/footerLogo.png")} style={styles.worldtekLogo} resizeMode="contain" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F7FA" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#F5F7FA" },

  // Fixed Header
  fixedHeader: {
    backgroundColor: "#FF6B35",
    padding: isTablet ? 30 : 24,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    zIndex: 1000,
  },
  title: { fontSize: isTablet ? 32 : 26, fontWeight: "800", color: "#fff" },
  subtitle: { fontSize: isTablet ? 16 : 14, color: "#FFE5DC", marginTop: 4, fontWeight: "500" },
  syncButton: { backgroundColor: "rgba(255,255,255,0.2)", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.3)" },
  syncText: { fontSize: 18, color: "#fff", fontWeight: "700" },

  // Sidebar
  sidebar: {
    width: 150,
    backgroundColor: "#fff",
    borderRightWidth: 1,
    borderRightColor: "#eee",
    paddingTop: 16,
    elevation: 8,
  },
  sidebarTitle: { fontSize: 17, fontWeight: "800", color: "#2C3E50", textAlign: "center", marginBottom: 20 },
  sidebarItem: { paddingVertical: 16, paddingHorizontal: 16, borderLeftWidth: 4, borderLeftColor: "transparent" },
  sidebarItemActive: { backgroundColor: "#FFF0ED", borderLeftColor: "#FF6B35" },
  sidebarItemText: { fontSize: 15, color: "#666", fontWeight: "600" },
  sidebarItemTextActive: { color: "#FF6B35", fontWeight: "800" },

  // Rest of your styles remain same...
  searchContainer: { flexDirection: "row", alignItems: "center", backgroundColor: "#fff", marginHorizontal: 16, marginTop: 16, marginBottom: 8, borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  searchIcon: { fontSize: 20, marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: isTablet ? 16 : 12, fontSize: isTablet ? 18 : 16, color: "#000", fontWeight: "500" },
  clearButton: { padding: 4 },
  clearText: { fontSize: 24, color: "#999" },

  sectionHeader: { marginTop: 24, marginHorizontal: 16, marginBottom: 12 },
  sectionTitleContainer: { flexDirection: "row", alignItems: "center" },
  sectionTitle: { fontSize: isTablet ? 24 : 20, fontWeight: "700", color: "#2C3E50", marginRight: 12 },
  sectionLine: { flex: 1, height: 2, backgroundColor: "#FF6B35", opacity: 0.3 },
  columnWrapper: { justifyContent: "space-between", paddingHorizontal: 12, gap: 8 },
  itemCard: { backgroundColor: "#fff", borderRadius: 16, padding: 12, margin: 4, flex: 1, maxWidth: numColumns === 3 ? "31%" : "48%", minHeight: isTablet ? 320 : 280, shadowColor: "#000", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.12, shadowRadius: 8, elevation: 5 },
  placeholderCard: { backgroundColor: "transparent", shadowOpacity: 0, elevation: 0 },
  imageContainer: { position: "relative", marginBottom: 12 },
  itemImage: { width: "100%", height: isTablet ? 140 : 120, borderRadius: 12, backgroundColor: "#F0F0F0" },
  placeholder: { justifyContent: "center", alignItems: "center", backgroundColor: "#FFE5DC" },
  placeholderText: { fontSize: 40 },
  foodTypeBadge: { position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14, justifyContent: "center", alignItems: "center", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 3 },
  vegBadge: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#4CAF50" },
  nonVegBadge: { backgroundColor: "#fff", borderWidth: 2, borderColor: "#E53935" },
  foodTypeIndicator: { width: 12, height: 12, borderRadius: 6 },
  vegIndicator: { backgroundColor: "#4CAF50" },
  nonVegIndicator: { backgroundColor: "#E53935" },
  details: { flex: 1, marginBottom: 8 },
  itemName: { fontSize: isTablet ? 18 : 16, fontWeight: "700", color: "#2C3E50", marginBottom: 4 },
  description: { fontSize: isTablet ? 14 : 13, color: "#7F8C8D", marginVertical: 4, lineHeight: 18 },
  price: { fontSize: isTablet ? 20 : 18, fontWeight: "800", color: "#FF6B35", marginTop: 8 },
  quantityContainer: { alignItems: "center", marginTop: 8 },
  addButton: { backgroundColor: "#FF6B35", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 20, shadowColor: "#FF6B35", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  addText: { color: "#fff", fontWeight: "700", fontSize: isTablet ? 16 : 14 },
  counter: { flexDirection: "row", alignItems: "center", backgroundColor: "#FFF3F0", borderRadius: 20, paddingHorizontal: 6, paddingVertical: 4, borderWidth: 1, borderColor: "#FFD4C8" },
  counterBtn: { width: isTablet ? 36 : 32, height: isTablet ? 36 : 32, backgroundColor: "#FF6B35", borderRadius: 16, justifyContent: "center", alignItems: "center" },
  counterText: { color: "#fff", fontSize: 20, fontWeight: "700" },
  counterValue: { marginHorizontal: 16, fontSize: isTablet ? 18 : 16, fontWeight: "700", color: "#2C3E50" },

  // Footer & Modals (same as before with new payment modal)
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.15, shadowRadius: 12, elevation: 12 },
  footerContent: { flexDirection: "row", padding: 16, alignItems: "center", justifyContent: "space-between" },
  summary: { flex: 1 },
  summaryLabel: { color: "#7F8C8D", fontSize: 12, fontWeight: "600" },
  summaryText: { color: "#2C3E50", fontSize: 14, fontWeight: "700" },
  totalContainer: { flex: 1, alignItems: "center" },
  totalLabel: { color: "#7F8C8D", fontSize: 12, fontWeight: "600" },
  totalText: { color: "#FF6B35", fontSize: 24, fontWeight: "800" },
  printBtn: { backgroundColor: "#FF6B35", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 25 },
  printBtnText: { color: "#fff", fontWeight: "800", fontSize: 18 },
  poweredBy: { flexDirection: "row", justifyContent: "center", paddingVertical: 8, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  poweredByText: { fontSize: 12, color: "#7F8C8D" },
  worldtekText: { fontSize: 12, color: "#FF6B35", fontWeight: "700" },
  emptyFooter: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 16, borderTopWidth: 1, borderTopColor: "#F0F0F0" },
  worldtekLogo: { width: 100, height: 40 },

  // Payment Modal
  paymentOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "center" },
  paymentModal: { backgroundColor: "#fff", width: "85%", borderRadius: 20, padding: 30, alignItems: "center" },
  paymentTitle: { fontSize: 24, fontWeight: "800", color: "#2C3E50", marginBottom: 30 },
  paymentButtons: { flexDirection: "row", gap: 20, marginBottom: 20 },
  paymentBtn: { paddingVertical: 18, paddingHorizontal: 40, borderRadius: 16, minWidth: 120 },
  cashBtn: { backgroundColor: "transparent", borderWidth: 2, borderColor: "#FF6B35" },
  upiBtn: { backgroundColor: "#FF6B35" },
  paymentBtnText: { color: "black", fontSize: 18, fontWeight: "700", textAlign: "center" },
  paymentCancel: { marginTop: 10 },
  paymentCancelText: { color: "#999", fontSize: 16, fontWeight: "600" },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  modalContent: { backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30, maxHeight: Dimensions.get("window").height * 0.9 },
  modalHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  modalTitle: { fontSize: 22, fontWeight: "800", color: "#2C3E50" },
  closeButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  closeButtonText: { fontSize: 12, color: "#999", fontWeight: "bold" },
  cartItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" },
  cartItemInfo: { flex: 1 },
  cartItemName: { fontSize: 16, fontWeight: "600", color: "#2C3E50" },
  cartItemPrice: { fontSize: 13, color: "#7F8C8D", marginTop: 4 },
  cartItemActions: { flexDirection: "row", alignItems: "center", marginRight: 16 },
  modalCounterBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#FF6B35", justifyContent: "center", alignItems: "center" },
  modalCounterText: { color: "#fff", fontSize: 20, fontWeight: "bold" },
  modalCounterValue: { marginHorizontal: 16, fontSize: 18, fontWeight: "700", color: "#2C3E50" },
  cartItemTotal: { fontSize: 16, fontWeight: "700", color: "#FF6B35", minWidth: 80, textAlign: "right" },
  modalTotal: { flexDirection: "row", justifyContent: "space-between", paddingTop: 16, paddingBottom: 8, borderTopWidth: 2, borderTopColor: "#FF6B35", marginTop: 16 },
  modalTotalLabel: { fontSize: 20, fontWeight: "700", color: "#2C3E50" },
  modalTotalAmount: { fontSize: 24, fontWeight: "800", color: "#FF6B35" },
  modalActions: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, gap: 12 },
  modalCloseBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#f0f0f0", alignItems: "center" },
  modalCloseBtnText: { fontSize: 16, fontWeight: "700", color: "#2C3E50" },
  modalPrintBtn: { flex: 1, paddingVertical: 14, borderRadius: 16, backgroundColor: "#FF6B35", alignItems: "center" },
  modalPrintBtnText: { fontSize: 16, fontWeight: "800", color: "#fff" },
  emptyCartText: { textAlign: "center", padding: 40, fontSize: 16, color: "#999" },

  loadingText: { marginTop: 16, fontSize: 18, color: "#7F8C8D", fontWeight: "600" },
  emptyContainer: { alignItems: "center", marginTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: 16 },
  noResults: { fontSize: 18, color: "#7F8C8D", fontWeight: "600" },
});

export default Walkins;